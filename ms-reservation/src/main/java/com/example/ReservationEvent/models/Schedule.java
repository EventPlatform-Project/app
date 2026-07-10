package com.example.ReservationEvent.models;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Schedule {
    private Long id;
    // On garde juste l'ID de l'event ou on supprime la référence cyclique
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
    private String speaker;
}