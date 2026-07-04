package com.applicationtracker.auth.security;

import com.applicationtracker.config.RateLimitProperties;
import com.applicationtracker.exception.TooManyRequestsException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties rateLimitProperties;
    private final Map<String, Deque<Instant>> requestLog = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(RateLimitProperties rateLimitProperties) {
        this.rateLimitProperties = rateLimitProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/auth/login")
                && !path.startsWith("/api/auth/register")
                && !path.startsWith("/api/auth/forgot-password");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String clientKey = resolveClientKey(request);

        if (!allowRequest(clientKey)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"message\":\"Too many requests. Please try again later.\",\"status\":429}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean allowRequest(String clientKey) {
        Instant now = Instant.now();
        Instant windowStart = now.minusSeconds(rateLimitProperties.authWindowSeconds());

        Deque<Instant> timestamps = requestLog.computeIfAbsent(clientKey, key -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(windowStart)) {
                timestamps.removeFirst();
            }

            if (timestamps.size() >= rateLimitProperties.authMaxRequests()) {
                return false;
            }

            timestamps.addLast(now);
            return true;
        }
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim() + ":" + request.getRequestURI();
        }
        return request.getRemoteAddr() + ":" + request.getRequestURI();
    }
}
