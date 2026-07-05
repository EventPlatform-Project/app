package com.smartevent.ticketservice.repository;

import com.smartevent.ticketservice.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByReservationId(Long reservationId);

    List<Ticket> findByUserId(Long userId);

    boolean existsByReservationId(Long reservationId);

    Optional<Ticket> findByTicketNumber(String ticketNumber);
}