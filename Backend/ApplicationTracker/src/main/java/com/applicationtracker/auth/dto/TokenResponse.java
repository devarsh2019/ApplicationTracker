package com.applicationtracker.auth.dto;

import java.time.Instant;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        long expiresIn
) {
}
