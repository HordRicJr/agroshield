package com.agroshield.infrastructure.persistence.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.agroshield.infrastructure.persistence.entity.PermissionEntity;

public interface PermissionRepository extends JpaRepository<PermissionEntity, UUID> {

    java.util.Optional<PermissionEntity> findByCode(String code);

    @Query(value = """
            SELECT p.code
            FROM permissions p
            JOIN role_permissions rp ON rp.permission_id = p.id
            JOIN roles r ON r.id = rp.role_id
            WHERE r.code = :roleCode
            """, nativeQuery = true)
    List<String> findCodesByRoleCode(@Param("roleCode") String roleCode);
}
