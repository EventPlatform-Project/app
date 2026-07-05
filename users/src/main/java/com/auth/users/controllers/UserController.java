package com.auth.users.controllers;

import com.auth.users.dtos.UserProfileResponse;
import com.auth.users.dtos.UserSummaryResponse;
import com.auth.users.dtos.UserUpdateRequest;
import com.auth.users.dtos.UserWithEventsResponse;
import com.auth.users.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.auth.users.dtos.EventDto;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getUserProfile(jwt.getSubject()));
    }

    /**
     * Internal lookup by Keycloak user id. Used by the events-service (Feign)
     * to fetch the organizer's email when publishing an "event created"
     * notification. Requires a valid JWT — the events-service forwards the
     * caller's token, so this endpoint is not publicly reachable without auth.
     */
    @GetMapping("/internal/{id}")
    public ResponseEntity<UserProfileResponse> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody UserUpdateRequest updateRequest) {
        return ResponseEntity.ok(userService.updateUserProfile(jwt.getSubject(), updateRequest));
    }

    /**
     * Admin-only: list all users. Enforced by Keycloak realm role.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<List<UserProfileResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * Lists users allowed to organize events (roles ORGANISATEUR or ADMINISTRATEUR).
     * Returns a lightweight summary safe to display to any authenticated user
     * (no email / timestamps). Used by the event-creation form to pick an organizer.
     */
    @GetMapping("/organizers")
    public ResponseEntity<List<UserSummaryResponse>> getOrganizers() {
        return ResponseEntity.ok(userService.getOrganizers());
    }

    /**
     * Events organized by the currently authenticated user.
     * Delegates to the events microservice via Feign.
     */
    @GetMapping("/events")
    public ResponseEntity<List<EventDto>> getMyEvents(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getEventsForUser(jwt.getSubject()));
    }

    /**
     * Events organized by an arbitrary user.
     * <ul>
     *   <li>Any authenticated user can query their OWN events (path id == JWT sub).</li>
     *   <li>Only administrators can query someone else's events.</li>
     * </ul>
     */
    @GetMapping("/{userId}/events")
    @PreAuthorize("#userId == authentication.token.subject or hasRole('ADMINISTRATEUR')")
    public ResponseEntity<List<EventDto>> getEventsForUser(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getEventsForUser(userId));
    }

    /**
     * Admin-only: list every user together with the events they organize.
     * Uses one aggregate call to the events microservice and joins in memory.
     */
    @GetMapping("/with-events")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<List<UserWithEventsResponse>> getAllUsersWithEvents() {
        return ResponseEntity.ok(userService.getAllUsersWithEvents());
    }

    /**
     * Ensures a local UserEntity exists for the currently authenticated Keycloak user.
     * Used by the frontend after the first login when a user was created directly
     * in Keycloak (e.g. via Keycloak's hosted registration page).
     */
    @PostMapping("/sync")
    public ResponseEntity<UserProfileResponse> syncCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.syncFromJwt(jwt));
    }
}
