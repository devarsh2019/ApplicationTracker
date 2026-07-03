package com.applicationtracker.auth.service;

import com.applicationtracker.auth.dto.AuthResponse;
import com.applicationtracker.auth.dto.ForgotPasswordRequest;
import com.applicationtracker.auth.dto.LoginRequest;
import com.applicationtracker.auth.dto.MessageResponse;
import com.applicationtracker.auth.dto.RefreshTokenRequest;
import com.applicationtracker.auth.dto.RegisterRequest;
import com.applicationtracker.auth.dto.ResetPasswordRequest;
import com.applicationtracker.auth.dto.TokenResponse;
import com.applicationtracker.auth.dto.UserResponse;
import com.applicationtracker.auth.entity.PasswordResetToken;
import com.applicationtracker.auth.entity.RefreshToken;
import com.applicationtracker.auth.entity.User;
import com.applicationtracker.auth.repository.PasswordResetTokenRepository;
import com.applicationtracker.auth.repository.RefreshTokenRepository;
import com.applicationtracker.auth.repository.UserRepository;
import com.applicationtracker.auth.security.AuthenticatedUser;
import com.applicationtracker.auth.security.JwtService;
import com.applicationtracker.config.JwtProperties;
import com.applicationtracker.config.PasswordResetProperties;
import com.applicationtracker.exception.BadRequestException;
import com.applicationtracker.exception.ConflictException;
import com.applicationtracker.exception.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final PasswordResetProperties passwordResetProperties;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties,
            PasswordResetProperties passwordResetProperties
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.passwordResetProperties = passwordResetProperties;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists.");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setTermsAccepted(request.acceptTerms());

        User savedUser = userRepository.save(user);
        return buildAuthResponse(savedUser, false);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!user.isEnabled()) {
            throw new UnauthorizedException("Account is disabled.");
        }

        return buildAuthResponse(user, request.rememberMe());
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(AuthenticatedUser authenticatedUser) {
        User user = userRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new UnauthorizedException("User not found."));
        return toUserResponse(user);
    }

    @Transactional
    public TokenResponse refresh(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository
                .findByTokenAndRevokedFalse(request.refreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token."));

        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            storedToken.setRevoked(true);
            refreshTokenRepository.save(storedToken);
            throw new UnauthorizedException("Refresh token expired.");
        }

        User user = storedToken.getUser();
        Instant originalExpiry = storedToken.getExpiresAt();
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        RefreshToken newRefreshToken = createRefreshToken(user, originalExpiry);

        return new TokenResponse(
                accessToken,
                newRefreshToken.getToken(),
                jwtService.getAccessTokenExpirationMs() / 1000
        );
    }

    @Transactional
    public void logout(AuthenticatedUser authenticatedUser, RefreshTokenRequest request) {
        refreshTokenRepository.findByTokenAndRevokedFalse(request.refreshToken())
                .ifPresent(token -> {
                    if (token.getUser().getId().equals(authenticatedUser.getId())) {
                        token.setRevoked(true);
                        refreshTokenRepository.save(token);
                    }
                });
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.email());
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setToken(UUID.randomUUID().toString());
            resetToken.setExpiresAt(Instant.now().plusMillis(passwordResetProperties.expirationMs()));
            resetToken.setUsed(false);
            passwordResetTokenRepository.save(resetToken);

            log.info("Password reset token for {}: {}", email, resetToken.getToken());
        });

        return new MessageResponse("If an account exists, a reset link has been sent.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenAndUsedFalse(request.token())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token."));

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Invalid or expired reset token.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        resetToken.setUsed(true);

        userRepository.save(user);
        passwordResetTokenRepository.save(resetToken);
        refreshTokenRepository.revokeAllByUser(user);

        return new MessageResponse("Password updated successfully.");
    }

    private AuthResponse buildAuthResponse(User user, boolean rememberMe) {
        refreshTokenRepository.revokeAllByUser(user);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        RefreshToken refreshToken = createRefreshToken(user, rememberMe);

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                jwtService.getAccessTokenExpirationMs() / 1000,
                toUserResponse(user)
        );
    }

    private RefreshToken createRefreshToken(User user, boolean rememberMe) {
        long expirationMs = rememberMe
                ? jwtProperties.rememberMeRefreshExpirationMs()
                : jwtProperties.refreshTokenExpirationMs();
        return createRefreshToken(user, Instant.now().plusMillis(expirationMs));
    }

    private RefreshToken createRefreshToken(User user, Instant expiresAt) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiresAt(expiresAt);
        refreshToken.setRevoked(false);
        return refreshTokenRepository.save(refreshToken);
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                true,
                user.getCreatedAt()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
