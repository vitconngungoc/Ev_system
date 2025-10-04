package com.fptu.evstation.rental.evrentalsystem.controller;

import com.fptu.evstation.rental.evrentalsystem.dto.*;
import com.fptu.evstation.rental.evrentalsystem.entity.User;
import com.fptu.evstation.rental.evrentalsystem.service.auth.AuthService;
import com.fptu.evstation.rental.evrentalsystem.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    /** Đăng ký tài khoản mới */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.register(req);  // Ném ResponseStatusException nếu lỗi
        return ResponseEntity.ok(Map.of(
                "message", "Đã đăng ký thành công",
                "UserName", user.getFullName()
        ));
    }

    /** Đăng nhập và nhận token */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse authResponse = authService.login(req);  // Ném ResponseStatusException nếu lỗi
        return ResponseEntity.ok(authResponse);
    }

    /** Đăng xuất (xóa token) */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(name = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Thiếu token");
        }
        String token = authHeader.substring(7);
        authService.logout(token);  // Ném ResponseStatusException nếu lỗi
        return ResponseEntity.ok(Map.of("message", "Đã đăng xuất thành công"));
    }
}
