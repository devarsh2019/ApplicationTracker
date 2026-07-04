package com.applicationtracker.application.dto;

import com.applicationtracker.application.entity.ApplicationStatus;

public record StatusCountResponse(
        ApplicationStatus status,
        long count
) {
}
