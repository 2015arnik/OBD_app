package com.obd.dto;

import com.obd.model.FundraiserStatus;
import java.time.LocalDate;

public class AdminUpdateFundraiserRequest {
    public Long targetUserId;
    public Long giftId;
    public String title;
    public Integer goalAmount;
    public Integer collectedAmount;
    public LocalDate deadline;
    public FundraiserStatus status;
}
