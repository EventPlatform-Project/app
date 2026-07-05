package com.auth.users.controllers;

import com.auth.users.dtos.LoginRequest;
import com.auth.users.dtos.LoginResponse;
import com.auth.users.dtos.RegisterRequest;
import com.auth.users.dtos.UserProfileResponse;
import com.auth.users.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserProfileResponse> register(@RequestBody RegisterRequest registerRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.registerUser(registerRequest));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(userService.loginUser(loginRequest));
    }

    @GetMapping("/hey")
    public ResponseEntity<String> hey() {
        return ResponseEntity.ok("Hey");
    }
}
