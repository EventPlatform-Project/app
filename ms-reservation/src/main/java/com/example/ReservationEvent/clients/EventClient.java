package com.example.ReservationEvent.clients;

import com.example.ReservationEvent.config.FeignConfig;
import com.example.ReservationEvent.models.Event;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * Feign client that reaches ms-event through the API gateway.
 * <p>
 * The base URL defaults to the docker-compose DNS name of the gateway
 * ({@code http://api-gateway:8888}) so calls succeed inside the container
 * network. When running from an IDE outside Docker, override with:
 * <pre>ms-reservation.gateway-url=http://localhost:8888</pre>
 * <p>
 * {@link FeignConfig} propagates the incoming {@code Authorization} header,
 * which is required because ms-event enforces JWT on {@code /api/events/**}.
 */
@FeignClient(
        name = "api-gateway",
        url = "${ms-reservation.gateway-url:http://api-gateway:8888}",
        configuration = FeignConfig.class
)
public interface EventClient {

    @GetMapping("/api/events/{id}")
    Event detail(@PathVariable("id") Long id);

    @GetMapping("/api/events/all")
    List<Event> list();

    /** Atomically decrement availablePlaces on the given event. */
    @PatchMapping("/api/events/{id}/decrement-places")
    Event decrementPlaces(@PathVariable("id") Long id, @RequestParam("by") int by);
}
