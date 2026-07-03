package com.applicationtracker.config;

import com.applicationtracker.auth.entity.User;
import com.applicationtracker.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    CommandLineRunner seedDemoUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String demoEmail = "demo@applicationtracker.com";

            if (userRepository.existsByEmailIgnoreCase(demoEmail)) {
                return;
            }

            User demoUser = new User();
            demoUser.setFullName("Demo User");
            demoUser.setEmail(demoEmail);
            demoUser.setPasswordHash(passwordEncoder.encode("Password123"));
            demoUser.setTermsAccepted(true);
            userRepository.save(demoUser);

            log.info("Seeded demo user: {} / Password123", demoEmail);
        };
    }
}
