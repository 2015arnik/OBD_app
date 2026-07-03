package com.obd.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A user subscribes to reminders about one friend (USER) or a whole GROUP. */
@Entity
@Table(name = "subscriptions")
@Getter @Setter @NoArgsConstructor
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long subscriberId;

    @Enumerated(EnumType.STRING)
    private SubscriptionTargetType targetType;

    /** Id of the user or the group (depending on targetType). */
    private Long targetId;
}
