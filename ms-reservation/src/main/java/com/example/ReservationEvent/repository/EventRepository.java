package com.example.ReservationEvent.repository;

import com.example.ReservationEvent.models.Event;
import com.example.ReservationEvent.models.EventCategory;
import com.example.ReservationEvent.models.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByOrganizerId(Long organizerId);

    List<Event> findByStatus(EventStatus status);

    List<Event> findByCategory(EventCategory category);
}
