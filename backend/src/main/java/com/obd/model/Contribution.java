package com.obd.model;

import jakarta.persistence.*;
import java.time.Instant;

/** One payment into a fundraiser (mock money). */
@Entity
@Table(name = "contributions")
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

    public Contribution() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFundraiserId() { return fundraiserId; }
    public void setFundraiserId(Long fundraiserId) { this.fundraiserId = fundraiserId; }

    public Long getContributorId() { return contributorId; }
    public void setContributorId(Long contributorId) { this.contributorId = contributorId; }

    public Integer getAmount() { return amount; }
    public void setAmount(Integer amount) { this.amount = amount; }

    public String getMockTxnId() { return mockTxnId; }
    public void setMockTxnId(String mockTxnId) { this.mockTxnId = mockTxnId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
