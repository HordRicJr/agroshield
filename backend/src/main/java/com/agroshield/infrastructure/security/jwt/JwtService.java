package com.agroshield.infrastructure.security.jwt;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.agroshield.infrastructure.config.AgroShieldProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtService {

    private final AgroShieldProperties.SecurityProperties security;
    private final SecretKey key;

    public JwtService(AgroShieldProperties properties) {
        this.security = properties.security();
        byte[] secret = security.jwtSecret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes");
        }
        this.key = Keys.hmacShaKeyFor(secret);
    }

    public String createAccessToken(
            UUID userId,
            String email,
            UUID organizationId,
            Collection<String> roles,
            Collection<String> permissions) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(security.accessTokenTtlSeconds());
        return Jwts.builder()
                .issuer(security.jwtIssuer())
                .audience().add(security.jwtAudience()).and()
                .subject(userId.toString())
                .claim("email", email)
                .claim("orgId", organizationId != null ? organizationId.toString() : null)
                .claim("roles", List.copyOf(roles))
                .claim("permissions", List.copyOf(permissions))
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(security.jwtIssuer())
                .requireAudience(security.jwtAudience())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long accessTtlSeconds() {
        return security.accessTokenTtlSeconds();
    }

    public long refreshTtlSeconds() {
        return security.refreshTokenTtlSeconds();
    }
}
