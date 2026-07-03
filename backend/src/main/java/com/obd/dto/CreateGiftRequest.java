package com.obd.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateGiftRequest {
    @NotBlank public String title;
    public String description;
    public String url;
    public Integer price;
}
