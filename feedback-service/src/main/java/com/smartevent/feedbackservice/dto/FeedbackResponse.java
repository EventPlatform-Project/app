package com.smartevent.feedbackservice.dto;

import com.smartevent.feedbackservice.entity.Feedback;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class FeedbackResponse {

    private Long id;
    private String userId;
    private String username;
    private String subject;
    private String message;
    private Integer rating;
    private Instant createdAt;

    public static FeedbackResponse fromEntity(Feedback f) {
        return FeedbackResponse.builder()
                .id(f.getId())
                .userId(f.getUserId())
                .username(f.getUsername())
                .subject(f.getSubject())
                .message(f.getMessage())
                .rating(f.getRating())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
