package com.example.ReservationEvent.models;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateReservationRequest {
    private String userId;
    private Long eventId; // Vérifiez bien l'orthographe ici
    private Integer seatNumber;
}