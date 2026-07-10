package com.smartevent.ticketservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationConfirmedEvent implements Serializable {

    private Long reservationId;
    private String userId;
    private Long eventId;
    private String eventTitle;
    private String userEmail;
    private String userFullName;
    private Integer seatNumber;
    private LocalDateTime confirmedAt;
}