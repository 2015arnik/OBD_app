package com.obd.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * A message in a gift-discussion room.
 * targetUserId = whose birthday is being discussed (the room owner).
 * The birthday person is NOT allowed to read their own room.
 */
@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long targetUserId;
    private Long authorId;

    @Column(length = 2000)
    private String text;

    private Instant createdAt = Instant.now();

    public ChatMessage() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTargetUserId() { return targetUserId; }
    public void setTargetUserId(Long targetUserId) { this.targetUserId = targetUserId; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
