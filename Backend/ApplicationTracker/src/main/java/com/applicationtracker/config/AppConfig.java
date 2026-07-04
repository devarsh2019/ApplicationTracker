package com.applicationtracker.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@EnableConfigurationProperties({
        JwtProperties.class,
        CorsProperties.class,
        AppProperties.class,
        RateLimitProperties.class
})
public class AppConfig {
}
