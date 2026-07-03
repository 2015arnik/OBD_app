package com.obd.web;

import com.obd.dto.ChatMessageDto;
import com.obd.model.User;
import com.obd.security.CurrentUser;
import com.obd.service.ChatService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/users/{id}/chat")
    public List<ChatMessageDto> history(@PathVariable Long id, @CurrentUser User me) {
        if (me.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot read the gift chat about yourself");
        }
        return chatService.history(id);
    }
}
