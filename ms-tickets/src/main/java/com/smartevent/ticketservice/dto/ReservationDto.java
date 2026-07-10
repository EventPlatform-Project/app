package com.smartevent.ticketservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lightweight projection of a Reservation as returned by ms-reservation.
 * We only bind the fields we actually need to generate a ticket.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationDto {

    private Long id;
    private String userId;
    private Long eventId;
    private String status;
    private Integer seatNumber;
    private LocalDateTime createdAt;
    private LocalDateTime cancelledAt;
}
