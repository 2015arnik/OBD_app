package com.obd.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateGroupRequest {
    @NotBlank public String name;
    public String description;
}
