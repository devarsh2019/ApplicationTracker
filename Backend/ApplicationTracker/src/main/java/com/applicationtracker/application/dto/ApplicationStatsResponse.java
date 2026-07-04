package com.applicationtracker.application.dto;

public record ApplicationStatsResponse(
        long totalApplications,
        int activeDays
) {
}
