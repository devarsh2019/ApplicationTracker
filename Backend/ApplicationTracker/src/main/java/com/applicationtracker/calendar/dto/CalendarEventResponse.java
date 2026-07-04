package com.applicationtracker.calendar.dto;

import com.applicationtracker.calendar.entity.CalendarEventType;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record CalendarEventResponse(
        UUID id,
        String title,
        String notes,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        boolean allDay,
        CalendarEventType eventType,
        UUID applicationId,
        String applicationCompanyName,
        Instant createdAt,
        Instant updatedAt
) {
}
