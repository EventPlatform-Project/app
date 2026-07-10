package com.auth.users.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Application-wide beans.
 * <p>
 * The {@link RestTemplate} used by {@link com.auth.users.services.KeycloakService}
 * MUST have explicit timeouts. Without them, a slow or hung Keycloak (very
 * common right after container start, or when the Keycloak connection pool
 * has a stale keep-alive socket) causes the entire user-registration HTTP
 * request to hang forever, blocking the caller and eventually the whole
 * Tomcat worker pool.
 */
@Configuration
public class AppConfig {

    /** Time to establish a TCP connection to Keycloak. */
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);

    /** Time to wait for a response after the request is sent. */
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(15);

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        // Use SimpleClientHttpRequestFactory so we don't depend on
        // Apache HttpClient being on the classpath. It's sufficient for
        // the light-weight sync calls we make to Keycloak.
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) CONNECT_TIMEOUT.toMillis());
        factory.setReadTimeout((int) READ_TIMEOUT.toMillis());

        return builder
                .requestFactory(() -> factory)
                .build();
    }
}
