package com.applicationtracker.application.dto;

import com.applicationtracker.application.entity.ApplicationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ApplicationRequest(
        @NotBlank @Size(max = 200) String companyName,
        @NotNull LocalDate appliedDate,
        @Size(max = 2048) String companyLink,
        @Size(max = 1000) String contactFollowUp,
        ApplicationStatus status,
        @Size(max = 2000) String notes
) {
}
