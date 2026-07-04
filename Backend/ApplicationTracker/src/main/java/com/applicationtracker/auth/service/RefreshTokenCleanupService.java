package com.applicationtracker.auth.service;

import com.applicationtracker.auth.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class RefreshTokenCleanupService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenCleanupService.class);

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenCleanupService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        int removed = refreshTokenRepository.deleteByExpiresAtBefore(Instant.now());
        if (removed > 0) {
            log.info("Removed {} expired refresh tokens", removed);
        }
    }
}
