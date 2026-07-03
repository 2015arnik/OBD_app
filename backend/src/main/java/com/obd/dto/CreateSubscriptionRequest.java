package com.obd.dto;

import com.obd.model.SubscriptionTargetType;
import jakarta.validation.constraints.NotNull;

/** Body for POST /subscriptions. */
public class CreateSubscriptionRequest {
    @NotNull public SubscriptionTargetType targetType; // USER or GROUP
    @NotNull public Long targetId;
}
