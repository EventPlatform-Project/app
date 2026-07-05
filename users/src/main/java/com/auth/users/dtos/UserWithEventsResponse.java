package com.auth.users.dtos;

import com.auth.users.entities.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * User profile enriched with the list of events they organize
 * (fetched from the events microservice via {@link com.auth.users.clients.EventClient}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserWithEventsResponse {
    private String id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
    private LocalDateTime createdAt;
    /** Total number of events organized by this user. */
    private int eventCount;
    /** Events organized by this user (may be empty). */
    private List<EventDto> events;
}
