package com.obd.dto;

import jakarta.validation.constraints.NotBlank;

public class ChangePasswordRequest {
    @NotBlank public String currentPassword;
    @NotBlank public String newPassword;
}
