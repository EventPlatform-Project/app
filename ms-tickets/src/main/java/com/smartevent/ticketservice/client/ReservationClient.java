package com.smartevent.ticketservice.client;

import com.smartevent.ticketservice.config.FeignConfig;
import com.smartevent.ticketservice.dto.ReservationDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Feign client to ms-reservation, called through the API gateway so we
 * reuse its Eureka routing without needing spring-cloud-loadbalancer here.
 * <p>
 * The base URL defaults to the docker-compose DNS name of the gateway; when
 * running outside Docker, override with
 * {@code ms-tickets.gateway-url=http://localhost:8888}.
 */
@FeignClient(
        name = "api-gateway",
        url = "${ms-tickets.gateway-url:http://api-gateway:8888}",
        configuration = FeignConfig.class
)
public interface ReservationClient {

    /** Returns every reservation belonging to the given Keycloak user id. */
    @GetMapping("/api/reservations/user/{userId}")
    List<ReservationDto> getReservationsByUser(@PathVariable("userId") String userId);

    /** Fetch a single reservation by its numeric id. */
    @GetMapping("/api/reservations/{id}")
    ReservationDto getReservationById(@PathVariable("id") Long id);
}
