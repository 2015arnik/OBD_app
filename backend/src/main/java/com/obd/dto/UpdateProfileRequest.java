package com.obd.dto;

import java.time.LocalDate;

/** Body for PATCH /users/{id}. Any field may be null (left unchanged). */
public class UpdateProfileRequest {
    public String name;
    public LocalDate birthDate;
}
