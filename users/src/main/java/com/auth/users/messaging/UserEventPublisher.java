package com.auth.users.messaging;

import com.auth.users.entities.UserEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Publishes user-related domain events to the Node.js notification-service
 * (over HTTP, via Feign). Runs asynchronously so a slow or unreachable
 * notification-service can never delay or fail user registration.
 */
@Component
public class UserEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(UserEventPublisher.class);

    private final NotificationClient notificationClient;

    public UserEventPublisher(NotificationClient notificationClient) {
        this.notificationClient = notificationClient;
    }

    @Async
    public void publishUserCreated(UserEntity user) {
        if (user == null) {
            return;
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "USER_CREATED");
        payload.put("id", user.getId());
        payload.put("username", user.getUsername());
        payload.put("email", user.getEmail());
        payload.put("firstName", user.getFirstName());
        payload.put("lastName", user.getLastName());
        payload.put("role", user.getRole() != null ? user.getRole().name() : null);
        payload.put("createdAt", Instant.now().toString());

        try {
            notificationClient.publish(payload);
            log.info("Published USER_CREATED event for user id={} username={}",
                    user.getId(), user.getUsername());
        } catch (Exception e) {
            // Notification failures must never propagate to the registration flow.
            log.warn("Failed to publish USER_CREATED event for user id={}: {}",
                    user.getId(), e.getMessage());
        }
    }
}
