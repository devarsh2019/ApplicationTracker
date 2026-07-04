package com.applicationtracker.application.dto;

import com.applicationtracker.application.entity.ApplicationStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ApplicationResponse(
        UUID id,
        String companyName,
        LocalDate appliedDate,
        String companyLink,
        String contactFollowUp,
        ApplicationStatus status,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}
