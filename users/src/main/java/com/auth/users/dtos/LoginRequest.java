package com.auth.users.dtos;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
}
