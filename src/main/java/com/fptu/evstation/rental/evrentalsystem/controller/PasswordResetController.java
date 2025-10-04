package com.fptu.evstation.rental.evrentalsystem.controller;


import com.fptu.evstation.rental.evrentalsystem.service.email.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {
    @Autowired
    private EmailService emailService;

    // Gửi OTP qua email
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được để trống");
        }
        emailService.createPasswordResetToken(email);  // Ném exception nếu email không tồn tại → Handler catch
        return ResponseEntity.ok(Map.of("message", "OTP đã được gửi tới email (có hiệu lực 5 phút)"));
    }

    // Xác minh OTP (giữ nguyên, chỉ tinh chỉnh return format)
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String otp = payload.get("otp");
        if (otp == null || otp.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP không được để trống");
        }
        if (!emailService.validateToken(otp)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP không hợp lệ hoặc đã hết hạn");
        }
        return ResponseEntity.ok(Map.of("message", "OTP hợp lệ"));
    }

    // Đặt lại mật khẩu
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String otp = payload.get("otp");
        String newPassword = payload.get("newPassword");
        if (otp == null || otp.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP và mật khẩu mới không được để trống");
        }
        emailService.resetPassword(otp, newPassword);  // Ném exception nếu OTP invalid/hết hạn → Handler catch
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công"));
    }

}
