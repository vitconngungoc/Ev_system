package com.fptu.evstation.rental.evrentalsystem.controller;

import com.fptu.evstation.rental.evrentalsystem.dto.AuthResponse;
import com.fptu.evstation.rental.evrentalsystem.dto.LoginRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.RegisterRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.User;
import com.fptu.evstation.rental.evrentalsystem.service.AuthService;
import com.fptu.evstation.rental.evrentalsystem.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.register(req);
        return ResponseEntity.ok(Map.of("message", "Đã đăng ký thành công", "userName", user.getFullName()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse authResponse = authService.login(req);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(name = "Authorization") String authHeader) {
        String token = authService.getTokenFromHeader(authHeader);
        authService.logout(token);
        return ResponseEntity.ok(Map.of("message", "Đã đăng xuất thành công"));
    }
}
