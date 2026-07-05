package com.auth.users.clients;

import com.auth.users.config.FeignConfig;
import com.auth.users.dtos.EventDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;


@FeignClient(
        name = "api-gateway",
        url = "${users-service.gateway-url:http://localhost:8888}",
        configuration = FeignConfig.class
)
public interface EventClient {

    @GetMapping("/api/events/all")
    List<EventDto> getAllEvents();

    @GetMapping("/api/events/by-organizer")
    List<EventDto> getEventsByOrganizer(@RequestParam("organizer") String organizerId);
}
