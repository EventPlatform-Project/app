package com.example.ReservationEvent.services;

import com.example.ReservationEvent.clients.EventClient;
import com.example.ReservationEvent.models.CreateReservationRequest;
import com.example.ReservationEvent.models.Event;
import com.example.ReservationEvent.models.EventStatus;
import com.example.ReservationEvent.models.Reservation;
import com.example.ReservationEvent.models.ReservationResponse;
import com.example.ReservationEvent.models.ReservationStatus;
import com.example.ReservationEvent.models.User;
import com.example.ReservationEvent.models.UserRole;
import com.example.ReservationEvent.repository.EventRepository;
import com.example.ReservationEvent.repository.ReservationRepository;
import com.example.ReservationEvent.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EventClient eventClient;

    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest request) {
        userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Aucun utilisateur trouvé"));

        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new EntityNotFoundException("Aucun événement trouvé"));

        if (event.getStatus() != EventStatus.ACTIVE) {
            throw new IllegalStateException("L'événement n'est pas actif");
        }

        if (event.getAvailablePlaces() <= 0) {
            throw new IllegalStateException("Aucune place disponible pour cet événement");
        }

        reservationRepository.findByUserIdAndEventId(request.getUserId(), request.getEventId())
                .ifPresent(r -> {
                    throw new IllegalStateException("Une réservation existe déjà pour cet utilisateur et cet événement");
                });

        Reservation reservation = Reservation.builder()
                .userId(request.getUserId())
                .eventId(request.getEventId())
                .seatNumber(request.getSeatNumber())
                .status(ReservationStatus.PENDING)
                .build();

        return ReservationResponse.fromEntity(reservationRepository.save(reservation));
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservationsByUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Aucun utilisateur trouvé"));

        return reservationRepository.findByUserId(userId).stream()
                .map(ReservationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservationsByEvent(Long eventId) {

        // juste vérifier que l'event existe via Feign (optionnel mais recommandé)
        Event event = eventClient.detail(eventId);

        if (event == null) {
            throw new EntityNotFoundException("Aucun événement trouvé");
        }

        return reservationRepository.findByEventId(eventId).stream()
                .map(ReservationResponse::fromEntity)
                .toList();
    }
    @Transactional(readOnly = true)
    public ReservationResponse getReservationById(Long id) {
        return reservationRepository.findById(id)
                .map(ReservationResponse::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Aucune réservation trouvée"));
    }

    @Transactional
    public ReservationResponse confirmReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aucune réservation trouvée"));

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalStateException("Seule une réservation en attente peut être confirmée");
        }

        Event event = eventRepository.findById(reservation.getEventId())
                .orElseThrow(() -> new EntityNotFoundException("Aucun événement trouvé"));

        if (event.getStatus() != EventStatus.ACTIVE) {
            throw new IllegalStateException("L'événement n'est pas actif");
        }

        if (event.getAvailablePlaces() <= 0) {
            throw new IllegalStateException("Aucune place disponible pour cet événement");
        }

        event.setAvailablePlaces(event.getAvailablePlaces() - 1);
        eventRepository.save(event);

        reservation.setStatus(ReservationStatus.CONFIRMED);
        return ReservationResponse.fromEntity(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse cancelReservation(Long id, User currentUser) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aucune réservation trouvée"));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new IllegalStateException("La réservation est déjà annulée");
        }

        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
        boolean isOwner = reservation.getUserId().equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new IllegalStateException("Vous n'êtes pas autorisé à annuler cette réservation");
        }

        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            Event event = eventRepository.findById(reservation.getEventId())
                    .orElseThrow(() -> new EntityNotFoundException("Aucun événement trouvé"));
            event.setAvailablePlaces(event.getAvailablePlaces() + 1);
            eventRepository.save(event);
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());
        return ReservationResponse.fromEntity(reservationRepository.save(reservation));
    }
}
