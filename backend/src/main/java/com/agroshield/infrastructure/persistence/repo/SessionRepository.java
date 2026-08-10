package com.agroshield.infrastructure.persistence.repo;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.SessionEntity;

public interface SessionRepository extends JpaRepository<SessionEntity, UUID> {
    Optional<SessionEntity> findByRefreshTokenHashAndRevokedAtIsNull(String refreshTokenHash);
}
