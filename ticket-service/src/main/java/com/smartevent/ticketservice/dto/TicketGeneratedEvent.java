package com.smartevent.ticketservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketGeneratedEvent implements Serializable {

    private Long ticketId;
    private String ticketNumber;
    private Long reservationId;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private Long eventId;
    private String eventTitle;
    private String qrCodeBase64;
    private LocalDateTime generatedAt;
}