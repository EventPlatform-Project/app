package feten.tn.eventservicefeten.Notifications;

import feten.tn.eventservicefeten.Clients.NotificationClient;
import feten.tn.eventservicefeten.Clients.UserClient;
import feten.tn.eventservicefeten.Dto.EventCreatedNotification;
import feten.tn.eventservicefeten.Dto.UserProfileDto;
import feten.tn.eventservicefeten.Entities.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class NotificationPublisher {

    private static final Logger log = LoggerFactory.getLogger(NotificationPublisher.class);

    private final UserClient userClient;
    private final NotificationClient notificationClient;

    public NotificationPublisher(UserClient userClient, NotificationClient notificationClient) {
        this.userClient = userClient;
        this.notificationClient = notificationClient;
    }

    @Async
    public void publishEventCreated(Event event) {
        try {
            UserProfileDto organizer = fetchOrganizerSafe(event.getOrganizerId());

            EventCreatedNotification payload = EventCreatedNotification.builder()
                    .eventId(event.getId())
                    .title(event.getTitle())
                    .description(event.getDescription())
                    .category(event.getCategory())
                    .organizerId(event.getOrganizerId())
                    .organizerEmail(organizer != null ? organizer.getEmail() : null)
                    .organizerName(organizer != null ? fullName(organizer) : null)
                    .maxPlaces(event.getMaxPlaces())
                    .createdAt(Instant.now())
                    .build();

            notificationClient.publishEventCreated(payload);
            log.info("Published EVENT_CREATED notification for eventId={} organizerId={}",
                    event.getId(), event.getOrganizerId());
        } catch (Exception e) {
            // Never let a notification failure bubble up
            log.warn("Failed to publish EVENT_CREATED notification for eventId={}: {}",
                    event.getId(), e.getMessage());
        }
    }

    private UserProfileDto fetchOrganizerSafe(String organizerId) {
        if (organizerId == null || organizerId.isBlank()) {
            return null;
        }
        try {
            return userClient.getUserById(organizerId);
        } catch (Exception e) {
            log.warn("Could not fetch organizer {} from users-service: {}", organizerId, e.getMessage());
            return null;
        }
    }

    private String fullName(UserProfileDto u) {
        String first = u.getFirstName() != null ? u.getFirstName() : "";
        String last = u.getLastName() != null ? u.getLastName() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? u.getUsername() : full;
    }
}
