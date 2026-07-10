package com.smartevent.feedbackservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Keycloak sub of the author (never null for authenticated posts). */
    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    /** Snapshot of the author's username for easy display without cross-service calls. */
    @Column(name = "username", length = 128)
    private String username;

    @Column(nullable = false, length = 160)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String message;

    /** Optional 1..5 star rating. Nullable for pure-text feedback. */
    @Column
    private Integer rating;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
