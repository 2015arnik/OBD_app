package com.obd.model;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A message in a gift-discussion room.
 * targetUserId = whose birthday is being discussed (the room owner).
 * The birthday person is NOT allowed to read their own room.
 */
@Entity
@Table(name = "chat_messages")
@Getter @Setter @NoArgsConstructor
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long targetUserId;
    private Long authorId;

    @Column(length = 2000)
    private String text;

    private Instant createdAt = Instant.now();
}
