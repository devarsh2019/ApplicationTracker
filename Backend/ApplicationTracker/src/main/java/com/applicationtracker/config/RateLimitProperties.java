package com.applicationtracker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(
        int authMaxRequests,
        int authWindowSeconds
) {
}
