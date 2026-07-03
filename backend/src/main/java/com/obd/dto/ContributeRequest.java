package com.obd.dto;

import jakarta.validation.constraints.NotNull;

public class ContributeRequest {
    @NotNull public Integer amount;
}
