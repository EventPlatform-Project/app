package com.smartevent.feedbackservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFeedbackRequest {

    @NotBlank
    @Size(max = 160)
    private String subject;

    @NotBlank
    @Size(max = 2000)
    private String message;

    /** Optional 1..5. */
    @Min(1)
    @Max(5)
    private Integer rating;
}
