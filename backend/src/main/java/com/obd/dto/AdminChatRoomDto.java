package com.obd.dto;

import java.time.Instant;

public class AdminChatRoomDto {
    public Long targetUserId;
    public String targetUserName;
    public Integer messagesCount;
    public Instant lastMessageAt;
    public String lastMessagePreview;

    public AdminChatRoomDto(Long targetUserId, String targetUserName, Integer messagesCount,
                            Instant lastMessageAt, String lastMessagePreview) {
        this.targetUserId = targetUserId;
        this.targetUserName = targetUserName;
        this.messagesCount = messagesCount;
        this.lastMessageAt = lastMessageAt;
        this.lastMessagePreview = lastMessagePreview;
    }
}
