package com.obd.model;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One payment into a fundraiser (mock money). */
@Entity
@Table(name = "contributions")
@Getter @Setter @NoArgsConstructor
public class Contribution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long fundraiserId;
    private Long contributorId;
    private Integer amount;

    /** Fake transaction id returned by the mock bank. */
    private String mockTxnId;

    private Instant createdAt = Instant.now();
}
