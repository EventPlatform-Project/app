package feten.tn.eventservicefeten.Services;

import feten.tn.eventservicefeten.Entities.Event;
import feten.tn.eventservicefeten.Entities.Schedule;
import feten.tn.eventservicefeten.Repositories.EventRepository;
import feten.tn.eventservicefeten.Repositories.ScheduleRepository;
import feten.tn.eventservicefeten.Exceptions.EventNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    public Event createEvent(Event event) {
        event.setAvailablePlaces(event.getMaxPlaces());
        return eventRepository.save(event);
    }

    /**
     * Atomically decrements {@code availablePlaces} for an event by the
     * given amount (default 1). Throws when the event doesn't exist or when
     * there aren't enough places left.
     */
    @Transactional
    public Event decrementAvailablePlaces(Long eventId, int amount) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found: " + eventId));

        Integer current = event.getAvailablePlaces();
        if (current == null) {
            current = event.getMaxPlaces() != null ? event.getMaxPlaces() : 0;
        }
        int delta = Math.max(1, amount);
        if (current < delta) {
            throw new IllegalStateException(
                "Not enough available places for event " + eventId +
                    " (have " + current + ", need " + delta + ")");
        }
        event.setAvailablePlaces(current - delta);
        return eventRepository.save(event);
    }

    public Schedule addSchedule(Long eventId, Schedule schedule) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        schedule.setEvent(event);
        return scheduleRepository.save(schedule);
    }

    public List<Event> getEventsByOrganizer(String organizer) {
        try {
            List<Event> events = eventRepository.findByOrganizerId(organizer);
            if (events == null || events.isEmpty()) {
                throw new EventNotFoundException("No events found for organizer " + organizer);
            }
            return events;
        } catch (EventNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event getEventById(Long id) {
        return eventRepository.findById(id).orElse(null);
    }

    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }
}