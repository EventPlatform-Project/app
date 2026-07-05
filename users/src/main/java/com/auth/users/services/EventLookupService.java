package com.auth.users.services;

import com.auth.users.clients.EventClient;
import com.auth.users.dtos.EventDto;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;


@Service
@RequiredArgsConstructor
@Slf4j
public class EventLookupService {

    private final EventClient eventClient;


    public List<EventDto> findEventsForUserSafe(String userId) {
        try {
            List<EventDto> events = eventClient.getEventsByOrganizer(userId);
            return events == null ? Collections.emptyList() : events;
        } catch (FeignException.NotFound nf) {
            // events-service returns 404 when no events are found for the organizer
            return Collections.emptyList();
        } catch (FeignException fe) {
            log.warn("Failed to fetch events for user {} (status={}): {}",
                    userId, fe.status(), fe.getMessage());
            return Collections.emptyList();
        } catch (Exception e) {
            log.warn("Unexpected error fetching events for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }


    public List<EventDto> findAllEventsSafe() {
        try {
            List<EventDto> events = eventClient.getAllEvents();
            return events == null ? Collections.emptyList() : events;
        } catch (FeignException fe) {
            log.warn("Failed to fetch all events (status={}): {}", fe.status(), fe.getMessage());
            return Collections.emptyList();
        } catch (Exception e) {
            log.warn("Unexpected error fetching all events: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
