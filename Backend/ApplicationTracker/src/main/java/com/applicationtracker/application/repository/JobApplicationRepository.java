package com.applicationtracker.application.repository;

import com.applicationtracker.application.entity.ApplicationStatus;
import com.applicationtracker.application.entity.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {

    Page<JobApplication> findByUser_IdOrderByAppliedDateDescCreatedAtDesc(UUID userId, Pageable pageable);

    Page<JobApplication> findByUser_IdAndAppliedDateOrderByCreatedAtDesc(
            UUID userId,
            LocalDate appliedDate,
            Pageable pageable
    );

    long countByUser_Id(UUID userId);

    Optional<JobApplication> findByIdAndUser_Id(UUID id, UUID userId);

    @Query("""
            SELECT a.appliedDate AS appliedDate, COUNT(a) AS count
            FROM JobApplication a
            WHERE a.user.id = :userId
            GROUP BY a.appliedDate
            ORDER BY a.appliedDate DESC
            """)
    java.util.List<DailyCountProjection> countApplicationsByAppliedDate(@Param("userId") UUID userId);

    @Query("""
            SELECT a.status AS status, COUNT(a) AS count
            FROM JobApplication a
            WHERE a.user.id = :userId
            GROUP BY a.status
            """)
    java.util.List<StatusCountProjection> countApplicationsByStatus(@Param("userId") UUID userId);

    interface StatusCountProjection {
        ApplicationStatus getStatus();

        long getCount();
    }

    interface DailyCountProjection {
        LocalDate getAppliedDate();

        long getCount();
    }
}
