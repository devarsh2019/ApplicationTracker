package com.applicationtracker.application.dto;

import java.time.LocalDate;

public record DailyCountResponse(
        LocalDate appliedDate,
        long count
) {
}
