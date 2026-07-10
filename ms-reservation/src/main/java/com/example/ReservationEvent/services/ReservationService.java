package com.example.ReservationEvent.services;

import com.example.ReservationEvent.clients.EventClient;
import com.example.ReservationEvent.messaging.ReservationEventPublisher;
import com.example.ReservationEvent.models.*;
import com.example.ReservationEvent.repository.ReservationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final EventClient eventClient;
    private final ReservationEventPublisher eventPublisher;

    /**
     * Récupère TOUTES les réservations de la base (Postgres)
     */
    public List<ReservationResponse> getAllReservations() {
        return reservationRepository.findAll().stream()
                .map(ReservationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest request) {
        // 1. Vérifier l'événement via ms-event
        Event event = eventClient.detail(request.getEventId());

        if (event == null) {
            throw new EntityNotFoundException("Événement introuvable dans le microservice ms-event");
        }

        if (event.getAvailablePlaces() != null && event.getAvailablePlaces() <= 0) {
            throw new IllegalStateException("Plus de places disponibles");
        }

        // 2. Créer la réservation
        Reservation reservation = Reservation.builder()
                .userId(request.getUserId())
                .eventId(request.getEventId())
                .status(ReservationStatus.PENDING)
                .seatNumber(request.getSeatNumber())
                .build();

        Reservation saved = reservationRepository.save(reservation);

        // 3. Publier l'événement RESERVATION_CREATED (fire-and-forget).
        // If RabbitMQ is momentarily down, the reservation is still persisted.
        eventPublisher.publishReservationCreated(saved);

        return ReservationResponse.fromEntity(saved);
    }

    public List<ReservationResponse> getReservationsByUser(String userId) {
        return reservationRepository.findByUserId(userId).stream()
                .map(ReservationResponse::fromEntity)
                .toList();
    }

    public List<ReservationResponse> getReservationsByEvent(Long eventId) {
        return reservationRepository.findByEventId(eventId).stream()
                .map(ReservationResponse::fromEntity)
                .toList();
    }

    public ReservationResponse getReservationById(Long id) {
        return reservationRepository.findById(id)
                .map(ReservationResponse::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Réservation #" + id + " introuvable"));
    }

    @Transactional
    public ReservationResponse confirmReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Réservation introuvable"));

        reservation.setStatus(ReservationStatus.CONFIRMED);
        return ReservationResponse.fromEntity(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse cancelReservation(Long id, User currentUser) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Réservation introuvable"));

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());

        return ReservationResponse.fromEntity(reservationRepository.save(reservation));
    }

}