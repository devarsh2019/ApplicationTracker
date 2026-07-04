package com.applicationtracker.application.controller;

import com.applicationtracker.application.dto.ApplicationRequest;
import com.applicationtracker.application.dto.ApplicationResponse;
import com.applicationtracker.application.dto.ApplicationStatsResponse;
import com.applicationtracker.application.dto.DailyCountResponse;
import com.applicationtracker.application.dto.StatusCountResponse;
import com.applicationtracker.application.service.ApplicationService;
import com.applicationtracker.auth.security.AuthenticatedUser;
import com.applicationtracker.common.dto.PageResponse;
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
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    public PageResponse<ApplicationResponse> listApplications(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate appliedDate
    ) {
        return applicationService.listApplications(authenticatedUser, appliedDate, page, size);
    }

    @GetMapping("/stats")
    public ApplicationStatsResponse getStats(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return applicationService.getStats(authenticatedUser);
    }

    @GetMapping("/daily-counts")
    public List<DailyCountResponse> getDailyCounts(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return applicationService.getDailyCounts(authenticatedUser);
    }

    @GetMapping("/status-counts")
    public List<StatusCountResponse> getStatusCounts(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return applicationService.getStatusCounts(authenticatedUser);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse createApplication(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody ApplicationRequest request
    ) {
        return applicationService.createApplication(authenticatedUser, request);
    }

    @PutMapping("/{id}")
    public ApplicationResponse updateApplication(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable UUID id,
            @Valid @RequestBody ApplicationRequest request
    ) {
        return applicationService.updateApplication(authenticatedUser, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteApplication(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable UUID id
    ) {
        applicationService.deleteApplication(authenticatedUser, id);
    }
}
