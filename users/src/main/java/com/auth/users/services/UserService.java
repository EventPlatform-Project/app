package com.auth.users.services;

import com.auth.users.dtos.*;
import com.auth.users.entities.UserEntity;
import com.auth.users.entities.UserRole;
import com.auth.users.messaging.UserEventPublisher;
import com.auth.users.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final KeycloakService keycloakService;
    private final EventLookupService eventLookupService;
    private final UserEventPublisher userEventPublisher;

    @Transactional
    public UserProfileResponse registerUser(RegisterRequest registerRequest) {
        if (registerRequest.getUsername() == null || registerRequest.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (registerRequest.getPassword() == null || registerRequest.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        String username = registerRequest.getUsername();
        String email = registerRequest.getEmail();
        if (email == null || email.trim().isEmpty()) {
            email = username + "@example.com";
        }

        UserRole role = registerRequest.getRole();
        if (role == null) {
            role = UserRole.PARTICIPANT;
        }

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        String roleName = role.name();
        String keycloakUserId = keycloakService.createUser(
                username,
                email,
                registerRequest.getPassword(),
                registerRequest.getFirstName(),
                registerRequest.getLastName(),
                roleName
        );

        // 2. Persist locally
        UserEntity userEntity = UserEntity.builder()
                .id(keycloakUserId)
                .username(username)
                .email(email)
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .role(role)
                .build();

        UserEntity savedUser = userRepository.save(userEntity);
        log.info("Registered user {} with role {} locally and in Keycloak", savedUser.getUsername(), savedUser.getRole());

        // Fire-and-forget: broadcast a USER_CREATED event so the notification-service
        // can push a live toast to every connected frontend.
        userEventPublisher.publishUserCreated(savedUser);

        return mapToProfileResponse(savedUser);
    }

    public LoginResponse loginUser(LoginRequest loginRequest) {
        LoginResponse response = keycloakService.authenticate(loginRequest);

        UserEntity user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User profile not found in local database"));

        response.setRole(user.getRole().name());
        return response;
    }

    public UserProfileResponse getUserProfile(String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateUserProfile(String userId, UserUpdateRequest updateRequest) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updateRequest.getFirstName() != null) {
            user.setFirstName(updateRequest.getFirstName());
        }
        if (updateRequest.getLastName() != null) {
            user.setLastName(updateRequest.getLastName());
        }

        UserEntity savedUser = userRepository.save(user);
        log.info("Updated user profile for user ID: {}", userId);
        return mapToProfileResponse(savedUser);
    }

    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToProfileResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns every user that is allowed to organize events
     * (i.e. everyone whose role is {@code ORGANISATEUR} or {@code ADMINISTRATEUR}).
     * <p>
     * The returned {@link UserSummaryResponse} is purposely minimal — no email,
     * no timestamps — so this endpoint is safe to expose to any authenticated
     * user and can be used to populate an organizer-picker.
     */
    public List<UserSummaryResponse> getOrganizers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.ORGANISATEUR
                          || u.getRole() == UserRole.ADMINISTRATEUR)
                .map(this::mapToSummary)
                .collect(Collectors.toList());
    }

    private UserSummaryResponse mapToSummary(UserEntity user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build();
    }

    /**
     * Returns the events organized by the given user, joined from the events
     * microservice via Feign. If the user has no events (events-service returns
     * 404) or the events-service is unreachable, this returns an empty list.
     *
     * @throws RuntimeException if the local user does not exist.
     */
    public List<EventDto> getEventsForUser(String userId) {
        // Verify the user exists locally so we fail fast with a meaningful error
        // instead of returning an empty list for a non-existent user.
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found: " + userId);
        }
        return eventLookupService.findEventsForUserSafe(userId);
    }

    /**
     * Lists every user together with the events they organize.
     * <p>
     * Uses a single call to {@code GET /api/events/all} on the events-service
     * (via Feign) and groups events per {@code organizerId} in memory, so this
     * costs O(N + M) with N = users and M = total events — no N+1 fan-out.
     */
    public List<UserWithEventsResponse> getAllUsersWithEvents() {
        List<UserEntity> users = userRepository.findAll();
        List<EventDto> allEvents = eventLookupService.findAllEventsSafe();

        Map<String, List<EventDto>> eventsByOrganizer = allEvents.stream()
                .filter(e -> e.getOrganizerId() != null)
                .collect(Collectors.groupingBy(EventDto::getOrganizerId));

        return users.stream()
                .map(u -> {
                    List<EventDto> events = eventsByOrganizer
                            .getOrDefault(u.getId(), java.util.Collections.emptyList());
                    return UserWithEventsResponse.builder()
                            .id(u.getId())
                            .username(u.getUsername())
                            .email(u.getEmail())
                            .firstName(u.getFirstName())
                            .lastName(u.getLastName())
                            .role(u.getRole())
                            .createdAt(u.getCreatedAt())
                            .eventCount(events.size())
                            .events(events)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Ensures a local UserEntity exists for the Keycloak user represented by the given JWT.
     * If the user does not exist locally yet (e.g. registered directly via Keycloak's
     * hosted registration page), this creates the local mirror record from JWT claims.
     * The local {@code id} always equals the Keycloak {@code sub}.
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public UserProfileResponse syncFromJwt(Jwt jwt) {
        String userId = jwt.getSubject();

        return userRepository.findById(userId)
                .map(this::mapToProfileResponse)
                .orElseGet(() -> {
                    String username = jwt.getClaimAsString("preferred_username");
                    String email = jwt.getClaimAsString("email");
                    String firstName = jwt.getClaimAsString("given_name");
                    String lastName = jwt.getClaimAsString("family_name");

                    if (username == null || username.isBlank()) {
                        username = (email != null && !email.isBlank()) ? email : userId;
                    }
                    if (email == null || email.isBlank()) {
                        email = username + "@example.com";
                    }

                    UserRole role = extractRoleFromJwt(jwt);

                    UserEntity entity = UserEntity.builder()
                            .id(userId)
                            .username(username)
                            .email(email)
                            .firstName(firstName)
                            .lastName(lastName)
                            .role(role)
                            .build();

                    UserEntity saved = userRepository.save(entity);
                    log.info("Synced local profile for Keycloak user {} (role={})", saved.getUsername(), saved.getRole());

                    // First time we ever see this user locally — treat it as a "user created" event
                    // so users who register directly via Keycloak's hosted page still trigger a notification.
                    userEventPublisher.publishUserCreated(saved);

                    return mapToProfileResponse(saved);
                });
    }

    @SuppressWarnings("unchecked")
    private UserRole extractRoleFromJwt(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
            for (Object role : roles) {
                String r = role.toString();
                for (UserRole ur : UserRole.values()) {
                    if (ur.name().equalsIgnoreCase(r)) {
                        return ur;
                    }
                }
            }
        }
        return UserRole.PARTICIPANT;
    }

    private UserProfileResponse mapToProfileResponse(UserEntity user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
