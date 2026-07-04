package com.applicationtracker.application.service;

import com.applicationtracker.application.dto.ApplicationRequest;
import com.applicationtracker.application.dto.ApplicationResponse;
import com.applicationtracker.application.dto.ApplicationStatsResponse;
import com.applicationtracker.application.dto.DailyCountResponse;
import com.applicationtracker.application.dto.StatusCountResponse;
import com.applicationtracker.application.entity.ApplicationStatus;
import com.applicationtracker.application.entity.JobApplication;
import com.applicationtracker.application.repository.JobApplicationRepository;
import com.applicationtracker.auth.entity.User;
import com.applicationtracker.auth.repository.UserRepository;
import com.applicationtracker.auth.security.AuthenticatedUser;
import com.applicationtracker.common.dto.PageResponse;
import com.applicationtracker.exception.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ApplicationService {

    private static final int MAX_PAGE_SIZE = 100;

    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public ApplicationService(
            JobApplicationRepository applicationRepository,
            UserRepository userRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ApplicationResponse> listApplications(
            AuthenticatedUser authenticatedUser,
            LocalDate appliedDate,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), normalizePageSize(size));
        Page<JobApplication> result = appliedDate == null
                ? applicationRepository.findByUser_IdOrderByAppliedDateDescCreatedAtDesc(
                        authenticatedUser.getId(),
                        pageable
                )
                : applicationRepository.findByUser_IdAndAppliedDateOrderByCreatedAtDesc(
                        authenticatedUser.getId(),
                        appliedDate,
                        pageable
                );

        return toPageResponse(result);
    }

    @Transactional(readOnly = true)
    public List<DailyCountResponse> getDailyCounts(AuthenticatedUser authenticatedUser) {
        return applicationRepository
                .countApplicationsByAppliedDate(authenticatedUser.getId())
                .stream()
                .map(row -> new DailyCountResponse(row.getAppliedDate(), row.getCount()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ApplicationStatsResponse getStats(AuthenticatedUser authenticatedUser) {
        UUID userId = authenticatedUser.getId();
        long totalApplications = applicationRepository.countByUser_Id(userId);
        int activeDays = applicationRepository.countApplicationsByAppliedDate(userId).size();
        return new ApplicationStatsResponse(totalApplications, activeDays);
    }

    @Transactional(readOnly = true)
    public List<StatusCountResponse> getStatusCounts(AuthenticatedUser authenticatedUser) {
        return applicationRepository
                .countApplicationsByStatus(authenticatedUser.getId())
                .stream()
                .map(row -> new StatusCountResponse(row.getStatus(), row.getCount()))
                .toList();
    }

    @Transactional
    public ApplicationResponse createApplication(
            AuthenticatedUser authenticatedUser,
            ApplicationRequest request
    ) {
        User user = getUser(authenticatedUser.getId());
        JobApplication application = new JobApplication();
        application.setUser(user);
        applyRequest(application, request);
        return toResponse(applicationRepository.save(application));
    }

    @Transactional
    public ApplicationResponse updateApplication(
            AuthenticatedUser authenticatedUser,
            UUID applicationId,
            ApplicationRequest request
    ) {
        JobApplication application = getOwnedApplication(authenticatedUser.getId(), applicationId);
        applyRequest(application, request);
        return toResponse(applicationRepository.save(application));
    }

    @Transactional
    public void deleteApplication(AuthenticatedUser authenticatedUser, UUID applicationId) {
        JobApplication application = getOwnedApplication(authenticatedUser.getId(), applicationId);
        applicationRepository.delete(application);
    }

    private JobApplication getOwnedApplication(UUID userId, UUID applicationId) {
        return applicationRepository.findByIdAndUser_Id(applicationId, userId)
                .orElseThrow(() -> new NotFoundException("Application not found."));
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));
    }

    private void applyRequest(JobApplication application, ApplicationRequest request) {
        application.setCompanyName(request.companyName().trim());
        application.setAppliedDate(request.appliedDate());
        application.setCompanyLink(normalizeOptional(request.companyLink()));
        application.setContactFollowUp(normalizeOptional(request.contactFollowUp()));
        application.setStatus(request.status() != null ? request.status() : ApplicationStatus.UNDER_CONSIDERATION);
        application.setNotes(normalizeOptional(request.notes()));
    }

    private int normalizePageSize(int size) {
        if (size <= 0) {
            return 20;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private PageResponse<ApplicationResponse> toPageResponse(Page<JobApplication> page) {
        return new PageResponse<>(
                page.getContent().stream().map(this::toResponse).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ApplicationResponse toResponse(JobApplication application) {
        return new ApplicationResponse(
                application.getId(),
                application.getCompanyName(),
                application.getAppliedDate(),
                application.getCompanyLink(),
                application.getContactFollowUp(),
                application.getStatus(),
                application.getNotes(),
                application.getCreatedAt(),
                application.getUpdatedAt()
        );
    }
}
