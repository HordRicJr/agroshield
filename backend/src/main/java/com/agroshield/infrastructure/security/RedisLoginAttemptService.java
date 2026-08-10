package com.agroshield.infrastructure.security;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.auth.LoginAttemptService;
import com.agroshield.infrastructure.config.AgroShieldProperties;

@Service
@Primary
@ConditionalOnBean(StringRedisTemplate.class)
public class RedisLoginAttemptService implements LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(RedisLoginAttemptService.class);
    private static final String ACCT_PREFIX = "agroshield:login:fail:acct:";
    private static final String IP_PREFIX = "agroshield:login:fail:ip:";

    private final StringRedisTemplate redis;
    private final int maxAccount;
    private final int maxIp;
    private final Duration window;
    private final Map<String, Window> localFallback = new ConcurrentHashMap<>();

    public RedisLoginAttemptService(StringRedisTemplate redis, AgroShieldProperties properties) {
        this.redis = redis;
        var cfg = properties.authRateLimit();
        this.maxAccount = cfg.maxAttempts();
        this.maxIp = cfg.maxAttemptsPerIp();
        this.window = Duration.ofSeconds(cfg.windowSeconds());
    }

    @Override
    public void assertNotLocked(String accountKey, String ipKey) {
        assertKey(ACCT_PREFIX + accountKey, maxAccount);
        assertKey(IP_PREFIX + ipKey, maxIp);
    }

    @Override
    public boolean recordFailure(String accountKey, String ipKey) {
        int acct = bump(ACCT_PREFIX + accountKey);
        int ip = bump(IP_PREFIX + ipKey);
        return acct >= maxAccount || ip >= maxIp;
    }

    @Override
    public void clearAccount(String accountKey) {
        String key = ACCT_PREFIX + accountKey;
        try {
            redis.delete(key);
        } catch (Exception ex) {
            log.warn("login_rate_limit redis_clear_failed reason={}", ex.getClass().getSimpleName());
        }
        localFallback.remove(key);
    }

    private void assertKey(String key, int max) {
        Integer count = readCount(key);
        if (count != null && count >= max) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Trop de tentatives — réessayez plus tard");
        }
    }

    private Integer readCount(String key) {
        try {
            String raw = redis.opsForValue().get(key);
            if (raw == null) {
                return localCount(key);
            }
            try {
                return Integer.parseInt(raw);
            } catch (NumberFormatException ex) {
                redis.delete(key);
                return localCount(key);
            }
        } catch (Exception ex) {
            log.warn("login_rate_limit redis_read_fallback reason={}", ex.getClass().getSimpleName());
            return localCount(key);
        }
    }

    private int bump(String key) {
        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, window);
            }
            if (count != null) {
                return count.intValue();
            }
        } catch (Exception ex) {
            log.warn("login_rate_limit redis_bump_fallback reason={}", ex.getClass().getSimpleName());
        }
        return localBump(key);
    }

    private Integer localCount(String key) {
        Window w = localFallback.get(key);
        if (w == null) {
            return null;
        }
        if (w.expired()) {
            localFallback.remove(key);
            return null;
        }
        return w.count.get();
    }

    private int localBump(String key) {
        long expires = System.currentTimeMillis() + window.toMillis();
        Window updated = localFallback.compute(key, (k, existing) -> {
            if (existing == null || existing.expired()) {
                return new Window(new AtomicInteger(1), expires);
            }
            existing.count.incrementAndGet();
            return existing;
        });
        return updated.count.get();
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
