package com.obd.dto;

import java.time.Instant;

public class ChatMessageDto {
    public Long id;
    public Long targetUserId;
    public Long authorId;
    public String authorName;
    public String text;
    public Instant createdAt;

    public ChatMessageDto(Long id, Long targetUserId, Long authorId, String authorName, String text, Instant createdAt) {
        this.id = id;
        this.targetUserId = targetUserId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.text = text;
        this.createdAt = createdAt;
    }
}
