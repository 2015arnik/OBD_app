package com.obd.dto;

import com.obd.model.SubscriptionTargetType;
import jakarta.validation.constraints.NotNull;

public class CreateSubscriptionRequest {
    @NotNull public SubscriptionTargetType targetType;
    @NotNull public Long targetId;
}
