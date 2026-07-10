package com.smartevent.feedbackservice.service;

import com.smartevent.feedbackservice.dto.CreateFeedbackRequest;
import com.smartevent.feedbackservice.dto.FeedbackResponse;
import com.smartevent.feedbackservice.entity.Feedback;
import com.smartevent.feedbackservice.repository.FeedbackRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final FeedbackRepository repo;

    @Transactional
    public FeedbackResponse create(String userId, String username, CreateFeedbackRequest req) {
        Feedback f = Feedback.builder()
                .userId(userId)
                .username(username)
                .subject(req.getSubject().trim())
                .message(req.getMessage().trim())
                .rating(req.getRating())
                .build();
        Feedback saved = repo.save(f);
        log.info("Feedback created id={} by user={} rating={}", saved.getId(), userId, saved.getRating());
        return FeedbackResponse.fromEntity(saved);
    }

    public List<FeedbackResponse> listAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(FeedbackResponse::fromEntity)
                .toList();
    }

    public List<FeedbackResponse> listMine(String userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(FeedbackResponse::fromEntity)
                .toList();
    }

    public FeedbackResponse get(Long id) {
        Feedback f = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Feedback not found: " + id));
        return FeedbackResponse.fromEntity(f);
    }

    @Transactional
    public void delete(Long id, String currentUserId, boolean isAdmin) {
        Feedback f = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Feedback not found: " + id));
        if (!isAdmin && !f.getUserId().equals(currentUserId)) {
            throw new SecurityException("Only the author or an administrator can delete this feedback");
        }
        repo.delete(f);
        log.info("Feedback deleted id={} by user={} admin={}", id, currentUserId, isAdmin);
    }
}
