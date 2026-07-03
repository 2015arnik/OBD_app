package com.obd.dto;

import jakarta.validation.constraints.NotBlank;

/** Body for POST /gifts. */
public class CreateGiftRequest {
    @NotBlank public String title;
    public String description;
    public String url;
    public Integer price;
}
