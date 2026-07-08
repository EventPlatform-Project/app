package com.example.ReservationEvent.repository;

import com.example.ReservationEvent.models.Reservation;
import com.example.ReservationEvent.models.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByUserId(Long userId);

    List<Reservation> findByEventId(Long eventId);

    List<Reservation> findByStatus(ReservationStatus status);

    Optional<Reservation> findByUserIdAndEventId(Long userId, Long eventId);
}
