package com.agroshield.application.users;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.audit.AuditService;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.application.users.dto.UserDtos.InviteUserRequest;
import com.agroshield.application.users.dto.UserDtos.MemberView;
import com.agroshield.application.users.dto.UserDtos.UpdateMemberRequest;
import com.agroshield.domain.security.PasswordHasher;
import com.agroshield.infrastructure.persistence.entity.OrganizationMemberEntity;
import com.agroshield.infrastructure.persistence.entity.RoleEntity;
import com.agroshield.infrastructure.persistence.entity.UserEntity;
import com.agroshield.infrastructure.persistence.repo.OrganizationMemberRepository;
import com.agroshield.infrastructure.persistence.repo.RoleRepository;
import com.agroshield.infrastructure.persistence.repo.UserRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

/** Gestion des membres de l'organisation courante (permission USER_MANAGE). */
@Service
public class UsersService {

    private static final List<String> VALID_STATUSES = List.of("ACTIVE", "DISABLED");

    private final UserRepository userRepository;
    private final OrganizationMemberRepository memberRepository;
    private final RoleRepository roleRepository;
    private final PasswordHasher passwordHasher;
    private final AuditService auditService;

    public UsersService(
            UserRepository userRepository,
            OrganizationMemberRepository memberRepository,
            RoleRepository roleRepository,
            PasswordHasher passwordHasher,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.roleRepository = roleRepository;
        this.passwordHasher = passwordHasher;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<MemberView> list() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return memberRepository.findByOrganizationId(principal.getOrganizationId()).stream()
                .map(this::toView)
                .toList();
    }

    @Transactional
    public MemberView invite(InviteUserRequest request) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        String email = request.email().trim().toLowerCase(java.util.Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email déjà utilisé");
        }
        RoleEntity role = roleRepository.findByCode(request.roleCode().trim().toUpperCase(java.util.Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rôle inconnu"));

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        user.setPasswordHash(passwordHasher.hash(request.temporaryPassword().toCharArray()));
        user.setPasswordChangedAt(Instant.now());
        user = userRepository.save(user);

        OrganizationMemberEntity member = new OrganizationMemberEntity();
        member.setOrganizationId(principal.getOrganizationId());
        member.setUserId(user.getId());
        member.setRoleId(role.getId());
        member = memberRepository.save(member);

        auditService.record(principal, "USER_INVITE", "user", user.getId().toString(),
                "SUCCESS", null, null, "{\"roleCode\":\"" + role.getCode() + "\"}");

        return toView(member, user, role.getCode());
    }

    @Transactional
    public MemberView update(UUID userId, UpdateMemberRequest request) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        OrganizationMemberEntity member = memberRepository
                .findByOrganizationIdAndUserId(principal.getOrganizationId(), userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membre introuvable"));

        if (request.roleCode() != null && !request.roleCode().isBlank()) {
            RoleEntity role = roleRepository.findByCode(request.roleCode().trim().toUpperCase(java.util.Locale.ROOT))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rôle inconnu"));
            member.setRoleId(role.getId());
        }
        if (request.status() != null && !request.status().isBlank()) {
            String status = request.status().trim().toUpperCase(java.util.Locale.ROOT);
            if (!VALID_STATUSES.contains(status)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut inconnu");
            }
            member.setStatus(status);
        }
        member = memberRepository.save(member);

        auditService.record(principal, "USER_UPDATE", "user", userId.toString(),
                "SUCCESS", null, null, null);

        return toView(member);
    }

    private MemberView toView(OrganizationMemberEntity member) {
        UserEntity user = userRepository.findById(member.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        String roleCode = roleRepository.findById(member.getRoleId())
                .map(RoleEntity::getCode)
                .orElse("PRODUCTEUR");
        return toView(member, user, roleCode);
    }

    private MemberView toView(OrganizationMemberEntity member, UserEntity user, String roleCode) {
        return new MemberView(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                roleCode,
                member.getStatus(),
                user.isMfaEnabled(),
                member.getJoinedAt());
    }
}
