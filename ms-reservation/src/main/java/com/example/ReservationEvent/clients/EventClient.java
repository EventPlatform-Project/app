package com.example.ReservationEvent.clients;

import com.example.ReservationEvent.models.Event;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "api-gateway", url = "http://localhost:8888")
public interface EventClient {

    @GetMapping("/{id}")
    public Event detail(@PathVariable Long id);
    @GetMapping("/all")
    public List<Event> list();
}
