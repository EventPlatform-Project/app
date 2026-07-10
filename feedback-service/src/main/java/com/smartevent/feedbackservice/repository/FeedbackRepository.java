package com.smartevent.feedbackservice.repository;

import com.smartevent.feedbackservice.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    List<Feedback> findAllByOrderByCreatedAtDesc();

    List<Feedback> findByUserIdOrderByCreatedAtDesc(String userId);
}
