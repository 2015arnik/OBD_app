package com.obd.dto;

import jakarta.validation.constraints.NotBlank;

/** Body for POST /auth/login. */
public class LoginRequest {
    @NotBlank public String email;
    @NotBlank public String password;
}
