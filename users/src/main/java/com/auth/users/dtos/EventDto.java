package com.auth.users.dtos;

import lombok.Data;
import java.util.List;

@Data
public class EventDto {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Integer maxPlaces;
    private Integer availablePlaces;
    private String organizerId;
    private String status;
    private List<Object> schedules;
}
