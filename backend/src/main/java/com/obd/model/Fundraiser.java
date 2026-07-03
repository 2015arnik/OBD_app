package com.obd.model;

import jakarta.persistence.*;
import java.time.LocalDate;

/** A money collection for a friend's gift (via the mock bank). */
@Entity
@Table(name = "fundraisers")
public class Fundraiser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long targetUserId;
    private Long giftId;
    private String title;

    private Integer goalAmount;
    private Integer collectedAmount = 0;

    @Enumerated(EnumType.STRING)
    private FundraiserStatus status = FundraiserStatus.OPEN;

    private LocalDate deadline;

    public Fundraiser() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTargetUserId() { return targetUserId; }
    public void setTargetUserId(Long targetUserId) { this.targetUserId = targetUserId; }

    public Long getGiftId() { return giftId; }
    public void setGiftId(Long giftId) { this.giftId = giftId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Integer getGoalAmount() { return goalAmount; }
    public void setGoalAmount(Integer goalAmount) { this.goalAmount = goalAmount; }

    public Integer getCollectedAmount() { return collectedAmount; }
    public void setCollectedAmount(Integer collectedAmount) { this.collectedAmount = collectedAmount; }

    public FundraiserStatus getStatus() { return status; }
    public void setStatus(FundraiserStatus status) { this.status = status; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
}
