package com.obd.dto;

import jakarta.validation.constraints.NotNull;

public class ChargeRequest {
    @NotNull public Integer amount;
    public String card;
}
