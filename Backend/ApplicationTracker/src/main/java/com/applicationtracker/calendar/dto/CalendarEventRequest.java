package com.applicationtracker.calendar.dto;

import com.applicationtracker.calendar.entity.CalendarEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record CalendarEventRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String notes,
        @NotNull LocalDateTime startsAt,
        LocalDateTime endsAt,
        boolean allDay,
        CalendarEventType eventType,
        UUID applicationId
) {
}
