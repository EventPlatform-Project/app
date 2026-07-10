package com.example.ReservationEvent.clients;

import com.example.ReservationEvent.models.Event;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

// CORRECTION : Ajoute /api/events à l'URL pour que la Gateway sache quel service appeler
@FeignClient(name = "ms-event", url = "http://localhost:8888/api/events")
public interface EventClient {

    @GetMapping("/{id}")
    Event detail(@PathVariable("id") Long id);

    @GetMapping("/all")
    List<Event> list();
}