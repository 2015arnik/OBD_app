package com.obd.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreateFundraiserRequest {
    @NotNull public Long targetUserId;
    public Long giftId;
    public String title;
    @NotNull public Integer goalAmount;
    public LocalDate deadline;
}
