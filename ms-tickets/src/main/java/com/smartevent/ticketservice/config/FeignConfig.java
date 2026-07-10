package com.smartevent.ticketservice.config;

import feign.RequestInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Feign configuration for ms-tickets. Forwards the incoming request's
 * {@code Authorization} header onto every outgoing Feign call so the target
 * microservice (ms-reservation) accepts JWT-authenticated requests.
 */
@Configuration
public class FeignConfig {

    private static final Logger log = LoggerFactory.getLogger(FeignConfig.class);
    private static final String AUTH_HEADER = "Authorization";

    @Bean
    public RequestInterceptor bearerAuthRequestInterceptor() {
        return template -> {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) {
                log.debug("Feign call outside of an HTTP request scope — no Authorization header to forward");
                return;
            }
            HttpServletRequest request = attrs.getRequest();
            String auth = request.getHeader(AUTH_HEADER);
            if (auth != null && !auth.isBlank()) {
                template.header(AUTH_HEADER, auth);
            }
        };
    }
}
