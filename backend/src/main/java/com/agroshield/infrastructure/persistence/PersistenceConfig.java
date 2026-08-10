package com.agroshield.infrastructure.persistence;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.agroshield.infrastructure.persistence.repo")
public class PersistenceConfig {
}
