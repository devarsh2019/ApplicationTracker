package com.applicationtracker.calendar.repository;

import com.applicationtracker.calendar.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {

    Optional<CalendarEvent> findByIdAndUser_Id(UUID id, UUID userId);

    @Query("""
            SELECT e FROM CalendarEvent e
            WHERE e.user.id = :userId
              AND e.startsAt >= :rangeStart
              AND e.startsAt < :rangeEnd
            ORDER BY e.startsAt ASC, e.title ASC
            """)
    List<CalendarEvent> findByUserInRange(
            @Param("userId") UUID userId,
            @Param("rangeStart") LocalDateTime rangeStart,
            @Param("rangeEnd") LocalDateTime rangeEnd
    );
}
