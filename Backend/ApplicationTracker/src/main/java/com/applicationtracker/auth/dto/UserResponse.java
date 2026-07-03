package com.applicationtracker.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String name,
        boolean emailVerified,
        Instant createdAt
) {
}
