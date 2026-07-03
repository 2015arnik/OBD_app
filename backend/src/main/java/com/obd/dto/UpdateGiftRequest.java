package com.obd.dto;

import com.obd.model.GiftStatus;

/** Body for PATCH /gifts/{id}. Any field may be null (left unchanged). */
public class UpdateGiftRequest {
    public String title;
    public String description;
    public String url;
    public Integer price;
    public GiftStatus status; // WANTED / RESERVED / BOUGHT
}
