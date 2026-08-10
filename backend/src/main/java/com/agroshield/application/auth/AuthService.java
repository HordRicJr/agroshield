package com.agroshield.application.auth;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.audit.AuditService;
import com.agroshield.application.auth.dto.LoginRequest;
import com.agroshield.application.auth.dto.MeResponse;
import com.agroshield.application.auth.dto.RefreshRequest;
import com.agroshield.application.auth.dto.RegisterRequest;
import com.agroshield.application.auth.dto.TokenResponse;
import com.agroshield.domain.security.ContentHasher;
import com.agroshield.domain.security.PasswordHasher;
import com.agroshield.infrastructure.persistence.entity.OrganizationEntity;
import com.agroshield.infrastructure.persistence.entity.OrganizationMemberEntity;
import com.agroshield.infrastructure.persistence.entity.SessionEntity;
import com.agroshield.infrastructure.persistence.entity.UserEntity;
import com.agroshield.infrastructure.persistence.repo.OrganizationMemberRepository;
import com.agroshield.infrastructure.persistence.repo.OrganizationRepository;
import com.agroshield.infrastructure.persistence.repo.PermissionRepository;
import com.agroshield.infrastructure.persistence.repo.RoleRepository;
import com.agroshield.infrastructure.persistence.repo.SessionRepository;
import com.agroshield.infrastructure.persistence.repo.UserRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;
import com.agroshield.infrastructure.security.jwt.JwtService;

@Service
public class AuthService {

    private static final String DEFAULT_ROLE = "RESPONSABLE";
    private final SecureRandom secureRandom = new SecureRandom();

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final SessionRepository sessionRepository;
    private final PasswordHasher passwordHasher;
    private final ContentHasher contentHasher;
    private final JwtService jwtService;
    private final LoginAttemptService loginAttemptService;
    private final AuditService auditService;

    public AuthService(
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            OrganizationMemberRepository memberRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            SessionRepository sessionRepository,
            PasswordHasher passwordHasher,
            ContentHasher contentHasher,
            JwtService jwtService,
            LoginAttemptService loginAttemptService,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.memberRepository = memberRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.sessionRepository = sessionRepository;
        this.passwordHasher = passwordHasher;
        this.contentHasher = contentHasher;
        this.jwtService = jwtService;
        this.loginAttemptService = loginAttemptService;
        this.auditService = auditService;
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email déjà utilisé");
        }

        OrganizationEntity org = new OrganizationEntity();
        org.setName(request.organizationName().trim());
        org.setSlug(slugify(request.organizationName()));
        org = organizationRepository.save(org);

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        user.setPasswordHash(passwordHasher.hash(request.password().toCharArray()));
        user.setPasswordChangedAt(Instant.now());
        user = userRepository.save(user);

        var role = roleRepository.findByCode(DEFAULT_ROLE)
                .orElseThrow(() -> new IllegalStateException("Role RESPONSABLE missing — run Flyway"));
        OrganizationMemberEntity member = new OrganizationMemberEntity();
        member.setOrganizationId(org.getId());
        member.setUserId(user.getId());
        member.setRoleId(role.getId());
        memberRepository.save(member);

        return issueTokens(user, org.getId(), List.of(DEFAULT_ROLE));
    }

    @Transactional
    public TokenResponse login(LoginRequest request, String clientIp) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String emailKey = contentHasher.sha256Hex(email);
        String ipKey = contentHasher.sha256Hex(clientIp == null || clientIp.isBlank() ? "unknown" : clientIp);
        loginAttemptService.assertNotLocked(emailKey, ipKey);

        UserEntity user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null || !passwordHasher.matches(request.password().toCharArray(), user.getPasswordHash())) {
            boolean locked = loginAttemptService.recordFailure(emailKey, ipKey);
            UUID orgId = null;
            UUID userId = null;
            if (user != null) {
                userId = user.getId();
                var memberships = memberRepository.findByUserId(user.getId());
                if (!memberships.isEmpty()) {
                    orgId = memberships.get(0).getOrganizationId();
                }
            }
            auditService.recordAnonymous(
                    orgId,
                    userId,
                    "LOGIN_FAILED",
                    "auth",
                    emailKey.substring(0, 16),
                    "FAILURE",
                    emailKey,
                    ipKey,
                    "{\"reason\":\"invalid_credentials\"}");
            if (locked) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Trop de tentatives — réessayez plus tard");
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants invalides");
        }
        if (!"ACTIVE".equals(user.getStatus())) {
            boolean locked = loginAttemptService.recordFailure(emailKey, ipKey);
            auditService.recordAnonymous(
                    null,
                    user.getId(),
                    "LOGIN_FAILED",
                    "auth",
                    emailKey.substring(0, 16),
                    "FAILURE",
                    emailKey,
                    ipKey,
                    "{\"reason\":\"inactive\"}");
            if (locked) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Trop de tentatives — réessayez plus tard");
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Compte inactif");
        }

        var memberships = memberRepository.findByUserId(user.getId());
        if (memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Aucune organisation");
        }
        var membership = memberships.get(0);
        var role = roleRepository.findById(membership.getRoleId())
                .orElseThrow(() -> new IllegalStateException("Role missing"));

        loginAttemptService.clearAccount(emailKey);
        return issueTokens(user, membership.getOrganizationId(), List.of(role.getCode()));
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest request) {
        String hash = contentHasher.sha256Hex(request.refreshToken());
        SessionEntity session = sessionRepository.findByRefreshTokenHashAndRevokedAtIsNull(hash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh invalide"));
        if (session.getExpiresAt().isBefore(Instant.now())) {
            session.setRevokedAt(Instant.now());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh expiré");
        }
        session.setRevokedAt(Instant.now());
        sessionRepository.save(session);

        UserEntity user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable"));
        var memberships = memberRepository.findByUserId(user.getId());
        String roleCode = DEFAULT_ROLE;
        UUID orgId = session.getOrganizationId();
        if (!memberships.isEmpty()) {
            orgId = memberships.get(0).getOrganizationId();
            roleCode = roleRepository.findById(memberships.get(0).getRoleId())
                    .map(r -> r.getCode())
                    .orElse(DEFAULT_ROLE);
        }
        return issueTokens(user, orgId, List.of(roleCode));
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        String hash = contentHasher.sha256Hex(refreshToken);
        sessionRepository.findByRefreshTokenHashAndRevokedAtIsNull(hash).ifPresent(session -> {
            session.setRevokedAt(Instant.now());
            sessionRepository.save(session);
        });
    }

    @Transactional(readOnly = true)
    public MeResponse me(AuthUserPrincipal principal) {
        UserEntity user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                principal.getOrganizationId(),
                principal.getRoles(),
                principal.getPermissions());
    }

    private TokenResponse issueTokens(UserEntity user, UUID organizationId, List<String> roles) {
        List<String> permissions = roles.stream()
                .flatMap(code -> permissionRepository.findCodesByRoleCode(code).stream())
                .distinct()
                .toList();

        String access = jwtService.createAccessToken(
                user.getId(), user.getEmail(), organizationId, roles, permissions);
        String refresh = generateRefreshToken();
        String refreshHash = contentHasher.sha256Hex(refresh);

        SessionEntity session = new SessionEntity();
        session.setUserId(user.getId());
        session.setOrganizationId(organizationId);
        session.setRefreshTokenHash(refreshHash);
        session.setExpiresAt(Instant.now().plusSeconds(jwtService.refreshTtlSeconds()));
        sessionRepository.save(session);

        return new TokenResponse(
                access,
                refresh,
                "Bearer",
                jwtService.accessTtlSeconds(),
                user.getId(),
                organizationId,
                user.getEmail(),
                roles,
                permissions);
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String slugify(String name) {
        String base = name.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-)|(-$)", "");
        if (base.isBlank()) {
            base = "org";
        }
        String slug = base;
        int i = 1;
        while (organizationRepository.findBySlug(slug).isPresent()) {
            slug = base + "-" + i++;
        }
        return slug.length() > 120 ? slug.substring(0, 120) : slug;
    }
}
