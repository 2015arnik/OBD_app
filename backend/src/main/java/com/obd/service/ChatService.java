package com.obd.service;

import com.obd.dto.ChatMessageDto;
import com.obd.model.ChatMessage;
import com.obd.model.User;
import com.obd.repository.ChatMessageRepository;
import com.obd.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ChatService {

    private final ChatMessageRepository messages;
    private final UserRepository users;

    public ChatService(ChatMessageRepository messages, UserRepository users) {
        this.messages = messages;
        this.users = users;
    }

    public List<ChatMessageDto> history(Long targetUserId) {
        List<ChatMessageDto> result = new ArrayList<>();
        for (ChatMessage m : messages.findByTargetUserIdOrderByCreatedAtAsc(targetUserId)) {
            result.add(toDto(m));
        }
        return result;
    }

    public ChatMessageDto save(Long targetUserId, Long authorId, String text) {
        ChatMessage m = new ChatMessage();
        m.setTargetUserId(targetUserId);
        m.setAuthorId(authorId);
        m.setText(text);
        m = messages.save(m);
        return toDto(m);
    }

    private ChatMessageDto toDto(ChatMessage m) {
        String name = users.findById(m.getAuthorId()).map(User::getName).orElse("?");
        return new ChatMessageDto(m.getId(), m.getTargetUserId(), m.getAuthorId(), name, m.getText(), m.getCreatedAt());
    }
}
