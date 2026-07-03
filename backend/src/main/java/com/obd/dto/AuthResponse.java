package com.obd.dto;

import com.obd.model.User;

/** What /auth/register and /auth/login return: a token + the user profile. */
public class AuthResponse {
    public String token;
    public User user;

    public AuthResponse(String token, User user) {
        this.token = token;
        this.user = user;
    }
}
