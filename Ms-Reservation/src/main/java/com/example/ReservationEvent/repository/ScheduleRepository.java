package com.example.ReservationEvent.repository;

import com.example.ReservationEvent.models.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    List<Schedule> findByEvent_Id(Long eventId);
}
