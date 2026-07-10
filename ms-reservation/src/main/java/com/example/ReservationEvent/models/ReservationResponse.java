package com.example.ReservationEvent.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationResponse {

    private Long id;
    private String userId; // CHANGÉ : Long -> String pour Keycloak
    private Long eventId;
    private ReservationStatus status;
    private Integer seatNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime cancelledAt;

    public static ReservationResponse fromEntity(Reservation reservation) {
        return ReservationResponse.builder()
                .id(reservation.getId())
                .userId(reservation.getUserId()) // Ici, reservation.getUserId() doit aussi retourner un String
                .eventId(reservation.getEventId())
                .status(reservation.getStatus())
                .seatNumber(reservation.getSeatNumber())
                .createdAt(reservation.getCreatedAt())
                .updatedAt(reservation.getUpdatedAt())
                .cancelledAt(reservation.getCancelledAt())
                .build();
    }
}