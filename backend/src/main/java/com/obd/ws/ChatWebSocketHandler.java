package com.obd.ws;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.obd.dto.ChatMessageDto;
import com.obd.model.User;
import com.obd.repository.UserRepository;
import com.obd.security.JwtService;
import com.obd.service.ChatService;
import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final JwtService jwtService;
    private final ChatService chatService;
    private final UserRepository users;
    private final ObjectMapper objectMapper;

    private final Map<Long, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(JwtService jwtService, ChatService chatService,
                                UserRepository users, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.chatService = chatService;
        this.users = users;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        Long targetUserId = extractTargetUserId(uri);
        Long authorId = jwtService.parseUserId(extractToken(uri));

        if (targetUserId == null || authorId == null) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }
        if (authorId.equals(targetUserId)) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Birthday person cannot join this room"));
            return;
        }
        User author = users.findById(authorId).orElse(null);
        if (author == null) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }
        session.getAttributes().put("targetUserId", targetUserId);
        session.getAttributes().put("authorId", authorId);
        session.getAttributes().put("authorName", author.getName());
        rooms.computeIfAbsent(targetUserId, k -> ConcurrentHashMap.newKeySet()).add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long targetUserId = (Long) session.getAttributes().get("targetUserId");
        Long authorId = (Long) session.getAttributes().get("authorId");
        if (targetUserId == null || authorId == null) {
            return;
        }
        JsonNode node = objectMapper.readTree(message.getPayload());
        String text = node.has("text") ? node.get("text").asText() : "";
        if (text == null || text.isBlank()) {
            return;
        }
        ChatMessageDto dto = chatService.save(targetUserId, authorId, text);
        broadcast(targetUserId, objectMapper.writeValueAsString(dto));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long targetUserId = (Long) session.getAttributes().get("targetUserId");
        if (targetUserId != null) {
            Set<WebSocketSession> room = rooms.get(targetUserId);
            if (room != null) {
                room.remove(session);
                if (room.isEmpty()) {
                    rooms.remove(targetUserId);
                }
            }
        }
    }

    private void broadcast(Long targetUserId, String payload) throws Exception {
        Set<WebSocketSession> room = rooms.get(targetUserId);
        if (room == null) {
            return;
        }
        TextMessage out = new TextMessage(payload);
        for (WebSocketSession s : room) {
            if (s.isOpen()) {
                s.sendMessage(out);
            }
        }
    }

    private Long extractTargetUserId(URI uri) {
        if (uri == null) {
            return null;
        }
        String[] parts = uri.getPath().split("/");
        try {
            return Long.valueOf(parts[parts.length - 1]);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String extractToken(URI uri) {
        if (uri == null || uri.getQuery() == null) {
            return "";
        }
        for (String pair : uri.getQuery().split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0 && pair.substring(0, eq).equals("token")) {
                return pair.substring(eq + 1);
            }
        }
        return "";
    }
}
