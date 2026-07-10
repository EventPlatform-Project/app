package feten.tn.eventservicefeten.Controllers;

import feten.tn.eventservicefeten.Entities.Event;
import feten.tn.eventservicefeten.Entities.Schedule;
import feten.tn.eventservicefeten.Services.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
//@CrossOrigin(origins = "*")

public class EventController {

    @Autowired
    private EventService eventService;

    @PostMapping("/create")
    public Event create(@RequestBody Event event) {
        return eventService.createEvent(event);
    }

    @GetMapping("/all")
    public List<Event> list() {
        return eventService.getAllEvents();
    }

    @GetMapping("/{id}")
    public Event detail(@PathVariable Long id) {
        return eventService.getEventById(id);
    }

    @PostMapping("/{eventId}/schedules")
    public Schedule addSchedule(@PathVariable Long eventId, @RequestBody Schedule schedule) {
        return eventService.addSchedule(eventId, schedule);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return "Deleted successfully";
    }

    @GetMapping("/by-organizer")
    public List<Event> listByOrganizer(@RequestParam String organizer) {
        return eventService.getEventsByOrganizer(organizer);
    }

    /**
     * Atomically decrement {@code availablePlaces} for the given event.
     * Called by ms-reservation right after a reservation is created (with a
     * JWT propagated through the Feign interceptor).
     */
    @PatchMapping("/{id}/decrement-places")
    public Event decrementPlaces(@PathVariable Long id,
                                 @RequestParam(name = "by", defaultValue = "1") int by) {
        return eventService.decrementAvailablePlaces(id, by);
    }
}