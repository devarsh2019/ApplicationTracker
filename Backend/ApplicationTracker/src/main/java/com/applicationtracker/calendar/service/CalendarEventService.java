package com.applicationtracker.calendar.service;

import com.applicationtracker.application.entity.JobApplication;
import com.applicationtracker.application.repository.JobApplicationRepository;
import com.applicationtracker.auth.entity.User;
import com.applicationtracker.auth.repository.UserRepository;
import com.applicationtracker.auth.security.AuthenticatedUser;
import com.applicationtracker.calendar.dto.CalendarEventRequest;
import com.applicationtracker.calendar.dto.CalendarEventResponse;
import com.applicationtracker.calendar.entity.CalendarEvent;
import com.applicationtracker.calendar.entity.CalendarEventType;
import com.applicationtracker.calendar.repository.CalendarEventRepository;
import com.applicationtracker.exception.BadRequestException;
import com.applicationtracker.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public CalendarEventService(
            CalendarEventRepository calendarEventRepository,
            JobApplicationRepository applicationRepository,
            UserRepository userRepository
    ) {
        this.calendarEventRepository = calendarEventRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> listEvents(
            AuthenticatedUser authenticatedUser,
            LocalDate from,
            LocalDate to
    ) {
        if (to.isBefore(from)) {
            throw new BadRequestException("'to' date must be on or after 'from' date.");
        }

        LocalDateTime rangeStart = from.atStartOfDay();
        LocalDateTime rangeEnd = to.plusDays(1).atStartOfDay();

        return calendarEventRepository
                .findByUserInRange(authenticatedUser.getId(), rangeStart, rangeEnd)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CalendarEventResponse createEvent(
            AuthenticatedUser authenticatedUser,
            CalendarEventRequest request
    ) {
        User user = getUser(authenticatedUser.getId());
        CalendarEvent event = new CalendarEvent();
        event.setUser(user);
        applyRequest(event, authenticatedUser.getId(), request);
        return toResponse(calendarEventRepository.save(event));
    }

    @Transactional
    public CalendarEventResponse updateEvent(
            AuthenticatedUser authenticatedUser,
            UUID eventId,
            CalendarEventRequest request
    ) {
        CalendarEvent event = getOwnedEvent(authenticatedUser.getId(), eventId);
        applyRequest(event, authenticatedUser.getId(), request);
        return toResponse(calendarEventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(AuthenticatedUser authenticatedUser, UUID eventId) {
        CalendarEvent event = getOwnedEvent(authenticatedUser.getId(), eventId);
        calendarEventRepository.delete(event);
    }

    private CalendarEvent getOwnedEvent(UUID userId, UUID eventId) {
        return calendarEventRepository.findByIdAndUser_Id(eventId, userId)
                .orElseThrow(() -> new NotFoundException("Calendar event not found."));
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));
    }

    private void applyRequest(CalendarEvent event, UUID userId, CalendarEventRequest request) {
        validateTimes(request);

        event.setTitle(request.title().trim());
        event.setNotes(normalizeOptional(request.notes()));
        event.setStartsAt(normalizeStart(request));
        event.setEndsAt(normalizeEnd(request));
        event.setAllDay(request.allDay());
        event.setEventType(request.eventType() != null ? request.eventType() : CalendarEventType.OTHER);
        event.setApplication(resolveApplication(userId, request.applicationId()));
    }

    private void validateTimes(CalendarEventRequest request) {
        if (request.endsAt() != null && request.endsAt().isBefore(request.startsAt())) {
            throw new BadRequestException("End time must be after start time.");
        }
    }

    private LocalDateTime normalizeStart(CalendarEventRequest request) {
        if (request.allDay()) {
            return request.startsAt().toLocalDate().atStartOfDay();
        }
        return request.startsAt();
    }

    private LocalDateTime normalizeEnd(CalendarEventRequest request) {
        if (request.endsAt() == null) {
            return null;
        }
        if (request.allDay()) {
            return request.endsAt().toLocalDate().atTime(23, 59, 59);
        }
        return request.endsAt();
    }

    private JobApplication resolveApplication(UUID userId, UUID applicationId) {
        if (applicationId == null) {
            return null;
        }

        return applicationRepository.findByIdAndUser_Id(applicationId, userId)
                .orElseThrow(() -> new NotFoundException("Linked application not found."));
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private CalendarEventResponse toResponse(CalendarEvent event) {
        JobApplication application = event.getApplication();
        return new CalendarEventResponse(
                event.getId(),
                event.getTitle(),
                event.getNotes(),
                event.getStartsAt(),
                event.getEndsAt(),
                event.isAllDay(),
                event.getEventType(),
                application != null ? application.getId() : null,
                application != null ? application.getCompanyName() : null,
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
