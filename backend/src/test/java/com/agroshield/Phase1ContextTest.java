package com.agroshield;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.agroshield.domain.security.ContentHasher;
import com.agroshield.domain.security.PasswordHasher;
import com.agroshield.infrastructure.persistence.repo.PermissionRepository;
import com.agroshield.infrastructure.persistence.repo.RoleRepository;

@SpringBootTest
@ActiveProfiles("test")
class Phase1ContextTest {

    @Autowired
    PasswordHasher passwordHasher;

    @Autowired
    ContentHasher contentHasher;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PermissionRepository permissionRepository;

    @Test
    void contextLoads() {
        assertThat(passwordHasher).isNotNull();
        assertThat(contentHasher).isNotNull();
    }

    @Test
    void argon2HashAndMatch() {
        char[] pwd = "JuryDemo!2026".toCharArray();
        String hash = passwordHasher.hash(pwd);
        assertThat(hash).startsWith("argon2id$");
        assertThat(passwordHasher.matches("JuryDemo!2026".toCharArray(), hash)).isTrue();
        assertThat(passwordHasher.matches("wrong".toCharArray(), hash)).isFalse();
    }

    @Test
    void sha256Deterministic() {
        String a = contentHasher.sha256Hex("agroshield");
        String b = contentHasher.sha256Hex("agroshield");
        assertThat(a).isEqualTo(b).hasSize(64);
    }

    @Test
    void flywaySeededRolesAndPermissions() {
        assertThat(roleRepository.count()).isEqualTo(6);
        assertThat(permissionRepository.count()).isEqualTo(10);
        assertThat(roleRepository.findByCode("ADMIN")).isPresent();
        assertThat(permissionRepository.findByCode("AUDIT_VIEW")).isPresent();
    }
}
