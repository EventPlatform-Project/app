package com.example.ReservationEvent.messaging;

import com.example.ReservationEvent.models.Reservation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Fire-and-forget publisher for reservation events. The HTTP request must
 * NOT fail if RabbitMQ is momentarily unavailable, so exceptions are
 * caught and logged.
 */
@Component
public class ReservationEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(ReservationEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:reservation.events}")
    private String exchange;

    public ReservationEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /** Publish RESERVATION_CREATED on the topic exchange. */
    @Async
    public void publishReservationCreated(Reservation r) {
        publish("reservation.created", "RESERVATION_CREATED", r,
                "Nouvelle réservation créée pour l'événement " + r.getEventId());
    }

    private void publish(String routingKey, String type, Reservation r, String message) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("type", type);
            payload.put("message", message);
            payload.put("reservationId", r.getId());
            payload.put("userId", r.getUserId());
            payload.put("eventId", r.getEventId());
            payload.put("seatNumber", r.getSeatNumber());
            payload.put("status", r.getStatus() != null ? r.getStatus().name() : null);
            payload.put("createdAt", Instant.now().toString());

            rabbitTemplate.convertAndSend(exchange, routingKey, payload);
            log.info("[rabbit] published {} rk={} reservationId={} eventId={}",
                    type, routingKey, r.getId(), r.getEventId());
        } catch (AmqpException ex) {
            log.warn("[rabbit] failed to publish {} for reservation {}: {}",
                    type, r.getId(), ex.getMessage());
        }
    }
}
