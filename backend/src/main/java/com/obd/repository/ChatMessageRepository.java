package com.obd.repository;

import com.obd.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByTargetUserIdOrderByCreatedAtAsc(Long targetUserId);
}
