package com.applicationtracker.calendar.controller;

import com.applicationtracker.auth.security.AuthenticatedUser;
import com.applicationtracker.calendar.dto.CalendarEventRequest;
import com.applicationtracker.calendar.dto.CalendarEventResponse;
import com.applicationtracker.calendar.service.CalendarEventService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/calendar/events")
public class CalendarEventController {

    private final CalendarEventService calendarEventService;

    public CalendarEventController(CalendarEventService calendarEventService) {
        this.calendarEventService = calendarEventService;
    }

    @GetMapping
    public List<CalendarEventResponse> listEvents(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return calendarEventService.listEvents(authenticatedUser, from, to);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CalendarEventResponse createEvent(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody CalendarEventRequest request
    ) {
        return calendarEventService.createEvent(authenticatedUser, request);
    }

    @PutMapping("/{id}")
    public CalendarEventResponse updateEvent(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable UUID id,
            @Valid @RequestBody CalendarEventRequest request
    ) {
        return calendarEventService.updateEvent(authenticatedUser, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable UUID id
    ) {
        calendarEventService.deleteEvent(authenticatedUser, id);
    }
}
