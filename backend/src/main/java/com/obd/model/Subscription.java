package com.obd.model;

import jakarta.persistence.*;

/** A user subscribes to reminders about one friend (USER) or a whole GROUP. */
@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long subscriberId;

    @Enumerated(EnumType.STRING)
    private SubscriptionTargetType targetType;

    /** Id of the user or the group (depending on targetType). */
    private Long targetId;

    public Subscription() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSubscriberId() { return subscriberId; }
    public void setSubscriberId(Long subscriberId) { this.subscriberId = subscriberId; }

    public SubscriptionTargetType getTargetType() { return targetType; }
    public void setTargetType(SubscriptionTargetType targetType) { this.targetType = targetType; }

    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
}
