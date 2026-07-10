package com.example.ReservationEvent.models;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Integer maxPlaces;
    private Integer availablePlaces;
    private String organizerId;
    private String status;
    private List<Schedule> schedules; // Liste de simples objets Schedule
}