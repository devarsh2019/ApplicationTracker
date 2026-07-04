package com.applicationtracker.auth.repository;

import com.applicationtracker.auth.entity.RefreshToken;
import com.applicationtracker.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);

    @Modifying
    @Query("update RefreshToken rt set rt.revoked = true where rt.user = :user and rt.revoked = false")
    void revokeAllByUser(User user);
}
