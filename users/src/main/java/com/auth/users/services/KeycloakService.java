package com.auth.users.services;

import com.auth.users.dtos.LoginRequest;
import com.auth.users.dtos.LoginResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakService {

    private final RestTemplate restTemplate;

    @Value("${keycloak.auth-server-url}")
    private String authServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    /**
     * Get Admin/Client Token to make Admin REST API calls.
     * We try client credentials flow first, fallback to password flow for admin user.
     */
    public String getAdminToken() {
        String tokenUrl = authServerUrl + "/realms/master/protocol/openid-connect/token";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", "admin-cli");
        body.add("username", adminUsername);
        body.add("password", adminPassword);
        body.add("grant_type", "password");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("access_token");
            }
        } catch (HttpClientErrorException e) {
            log.error("Failed to authenticate admin via master realm: {}", e.getResponseBodyAsString());
        }

        // Fallback or Try Realm Client Credentials
        String realmTokenUrl = authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";
        body.clear();
        body.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isEmpty() && !clientSecret.equals("your-client-secret-here")) {
            body.add("client_secret", clientSecret);
        }
        body.add("grant_type", "client_credentials");

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(realmTokenUrl, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("access_token");
            }
        } catch (Exception e) {
            log.error("Failed to authenticate via client credentials: {}", e.getMessage());
        }

        throw new RuntimeException("Could not obtain Keycloak admin token");
    }

    /**
     * Create user in Keycloak and assign role.
     * Returns the created user's Keycloak ID (UUID).
     */
    public String createUser(String username, String email, String password, String firstName, String lastName, String roleName) {
        String adminToken = getAdminToken();
        String createUserUrl = authServerUrl + "/admin/realms/" + realm + "/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, Object> userRepresentation = Map.of(
                "username", username,
                "email", email,
                "enabled", true,
                "emailVerified", true,
                "requiredActions", List.of(),
                "firstName", firstName != null ? firstName : "",
                "lastName", lastName != null ? lastName : "",
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", password,
                        "temporary", false
                ))
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(userRepresentation, headers);

        ResponseEntity<Void> response;
        try {
            response = restTemplate.postForEntity(createUserUrl, request, Void.class);
        } catch (HttpClientErrorException e) {
            log.error("Keycloak user creation failed: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("User registration in Keycloak failed: " + e.getResponseBodyAsString());
        }

        if (response.getStatusCode() != HttpStatus.CREATED) {
            throw new RuntimeException("User was not created in Keycloak, status: " + response.getStatusCode());
        }

        URI location = response.getHeaders().getLocation();
        if (location == null) {
            throw new RuntimeException("Keycloak did not return User Location URI");
        }

        String path = location.getPath();
        String userId = path.substring(path.lastIndexOf('/') + 1);

        // Assign Role to user
        assignRoleToUser(userId, roleName, adminToken);

        return userId;
    }

    /**
     * Fetch Keycloak role details to obtain its ID and object structure, then assign it.
     */
    private void assignRoleToUser(String userId, String roleName, String adminToken) {
        try {
            // Get role representation from Keycloak
            String getRoleUrl = authServerUrl + "/admin/realms/" + realm + "/roles/" + roleName;
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(adminToken);
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<Map> roleResponse = restTemplate.exchange(getRoleUrl, HttpMethod.GET, requestEntity, Map.class);
            if (!roleResponse.getStatusCode().is2xxSuccessful() || roleResponse.getBody() == null) {
                log.warn("Role {} not found in Keycloak realm", roleName);
                return;
            }

            Map<String, Object> roleRepresentation = roleResponse.getBody();

            // Assign role to user
            String assignRoleUrl = authServerUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm";
            HttpEntity<List<Map<String, Object>>> assignRequest = new HttpEntity<>(List.of(roleRepresentation), headers);

            restTemplate.postForEntity(assignRoleUrl, assignRequest, Void.class);
            log.info("Assigned role {} to user {}", roleName, userId);

        } catch (Exception e) {
            log.error("Failed to assign role {} to user {}: {}", roleName, userId, e.getMessage());
            // We do not throw to avoid rolling back DB transaction if Keycloak user is already created,
            // but in production, we should handle this carefully.
        }
    }

    /**
     * Delete a user from Keycloak by ID.
     * <p>
     * Returns silently if the user does not exist (404 from Keycloak), so
     * this method is idempotent from the caller's point of view.
     *
     * @param userId the Keycloak user ID (same as the local {@code UserEntity.id}).
     */
    public void deleteUser(String userId) {
        String adminToken = getAdminToken();
        String url = authServerUrl + "/admin/realms/" + realm + "/users/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            restTemplate.exchange(url, HttpMethod.DELETE, requestEntity, Void.class);
            log.info("Deleted Keycloak user {}", userId);
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Keycloak user {} not found (already deleted?)", userId);
        } catch (HttpClientErrorException e) {
            log.error("Failed to delete Keycloak user {}: {} - {}",
                    userId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Failed to delete user in Keycloak: " + e.getStatusCode());
        }
    }

    /**
     * Authenticate user credentials directly with Keycloak.
     */
    public LoginResponse authenticate(LoginRequest loginRequest) {
        String tokenUrl = authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isEmpty() && !clientSecret.equals("your-client-secret-here")) {
            body.add("client_secret", clientSecret);
        }
        body.add("username", loginRequest.getUsername());
        body.add("password", loginRequest.getPassword());
        body.add("grant_type", "password");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                return LoginResponse.builder()
                        .accessToken((String) responseBody.get("access_token"))
                        .refreshToken((String) responseBody.get("refresh_token"))
                        .expiresIn(((Number) responseBody.get("expires_in")).longValue())
                        .username(loginRequest.getUsername())
                        .build();
            }
        } catch (HttpClientErrorException e) {
            log.error("Authentication failed: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Invalid credentials or authentication failed");
        }

        throw new RuntimeException("Authentication response was empty");
    }
}
