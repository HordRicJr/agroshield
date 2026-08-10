package com.agroshield.infrastructure.security;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.auth.LoginAttemptService;
import com.agroshield.infrastructure.config.AgroShieldProperties;

@Service
@ConditionalOnMissingBean(StringRedisTemplate.class)
public class InMemoryLoginAttemptService implements LoginAttemptService {

    private final int maxAccount;
    private final int maxIp;
    private final long windowMillis;
    private final Map<String, Window> attempts = new ConcurrentHashMap<>();

    public InMemoryLoginAttemptService(AgroShieldProperties properties) {
        var cfg = properties.authRateLimit();
        this.maxAccount = cfg.maxAttempts();
        this.maxIp = cfg.maxAttemptsPerIp();
        this.windowMillis = cfg.windowSeconds() * 1000L;
    }

    @Override
    public void assertNotLocked(String accountKey, String ipKey) {
        assertKey("acct:" + accountKey, maxAccount);
        assertKey("ip:" + ipKey, maxIp);
    }

    @Override
    public void recordFailure(String accountKey, String ipKey) {
        bump("acct:" + accountKey);
        bump("ip:" + ipKey);
    }

    @Override
    public void clearAccount(String accountKey) {
        attempts.remove("acct:" + accountKey);
    }

    private void assertKey(String key, int max) {
        Window window = attempts.get(key);
        if (window == null) {
            return;
        }
        if (window.expired()) {
            attempts.remove(key);
            return;
        }
        if (window.count.get() >= max) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Trop de tentatives — réessayez plus tard");
        }
    }

    private void bump(String key) {
        attempts.compute(key, (k, existing) -> {
            long expires = System.currentTimeMillis() + windowMillis;
            if (existing == null || existing.expired()) {
                return new Window(new AtomicInteger(1), expires);
            }
            existing.count.incrementAndGet();
            return existing;
        });
    }

    private static final class Window {
        private final AtomicInteger count;
        private final long expiresAtMillis;

        private Window(AtomicInteger count, long expiresAtMillis) {
            this.count = count;
            this.expiresAtMillis = expiresAtMillis;
        }

        private boolean expired() {
            return System.currentTimeMillis() > expiresAtMillis;
        }
    }
}
