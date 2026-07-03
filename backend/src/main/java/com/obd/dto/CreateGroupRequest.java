package com.obd.dto;

import jakarta.validation.constraints.NotBlank;

/** Body for POST /groups. */
public class CreateGroupRequest {
    @NotBlank public String name;
    public String description;
}
