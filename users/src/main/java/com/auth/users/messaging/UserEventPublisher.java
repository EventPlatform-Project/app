package com.auth.users.messaging;

import com.auth.users.entities.UserEntity;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;


@Component
public class UserEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(UserEventPublisher.class);

    private static final String RK_USER_CREATED = "user.created";
    private static final String RK_USER_UPDATED = "user.updated";
    private static final String RK_USER_DELETED = "user.deleted";

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:user.events}")
    private String exchange;

    public UserEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @PostConstruct
    public void init() {
        log.info("[rabbit] UserEventPublisher wired (exchange={})", exchange);
    }

    @Async
    public void publishUserCreated(UserEntity user) {
        publish(RK_USER_CREATED, "USER_CREATED", user);
    }

    @Async
    public void publishUserUpdated(UserEntity user) {
        publish(RK_USER_UPDATED, "USER_UPDATED", user);
    }

    @Async
    public void publishUserDeleted(UserEntity user) {
        publish(RK_USER_DELETED, "USER_DELETED", user);
    }

    private void publish(String routingKey, String type, UserEntity user) {
        if (user == null) {
            log.warn("[rabbit] publish({}) skipped: user is null", type);
            return;
        }

        log.info("[rabbit] preparing to publish {} for userId={} username={}",
                type, user.getId(), user.getUsername());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", type);
        payload.put("id", user.getId());
        payload.put("username", user.getUsername());
        payload.put("email", user.getEmail());
        payload.put("firstName", user.getFirstName());
        payload.put("lastName", user.getLastName());
        payload.put("role", user.getRole() != null ? user.getRole().name() : null);
        payload.put("createdAt", Instant.now().toString());

        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, payload);
            log.info("[rabbit] PUBLISHED {} exchange={} routingKey={} userId={}",
                    type, exchange, routingKey, user.getId());
        } catch (Exception e) {
            // Broker failures must never propagate to the registration flow.
            log.error("[rabbit] FAILED to publish {} for user id={}: {}",
                    type, user.getId(), e.getMessage(), e);
        }
    }
}
