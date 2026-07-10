package com.smartevent.feedbackservice.controller;

import com.smartevent.feedbackservice.dto.CreateFeedbackRequest;
import com.smartevent.feedbackservice.dto.FeedbackResponse;
import com.smartevent.feedbackservice.service.FeedbackService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@Slf4j
public class FeedbackController {

    private final FeedbackService service;

    /**
     * Any authenticated user posts a new feedback. The author is derived from
     * the JWT (sub + preferred_username) — the client cannot spoof it.
     */
    @PostMapping
    public ResponseEntity<FeedbackResponse> create(
            @Valid @RequestBody CreateFeedbackRequest body,
            @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getSubject();
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null || username.isBlank()) {
            username = jwt.getClaimAsString("email");
        }

        FeedbackResponse saved = service.create(userId, username, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** Feedback posted by the currently authenticated user. */
    @GetMapping("/mine")
    public ResponseEntity<List<FeedbackResponse>> mine(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.listMine(jwt.getSubject()));
    }

    /** Public read: any authenticated user can browse all feedback entries. */
    @GetMapping
    public ResponseEntity<List<FeedbackResponse>> all() {
        return ResponseEntity.ok(service.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeedbackResponse> byId(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

    /**
     * The author can delete their own feedback; administrators can delete any.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        Jwt jwt = (Jwt) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRATEUR"));
        service.delete(id, jwt.getSubject(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    // ─── Exception handlers ─────────────────────────────────────────────────

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> notFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> forbidden(SecurityException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
