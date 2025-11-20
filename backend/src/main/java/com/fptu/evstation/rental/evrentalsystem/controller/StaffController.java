package com.fptu.evstation.rental.evrentalsystem.controller;

import com.fptu.evstation.rental.evrentalsystem.dto.DashboardSummaryDto;
import com.fptu.evstation.rental.evrentalsystem.dto.VerifyRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.User;
import com.fptu.evstation.rental.evrentalsystem.service.AuthService;
import com.fptu.evstation.rental.evrentalsystem.service.DashboardService;
import com.fptu.evstation.rental.evrentalsystem.service.impl.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {
    private final AuthService authService;
    private final UserServiceImpl userService;
    private final DashboardService dashboardService;

    @GetMapping("/verifications/pending")
    public ResponseEntity<List<User>> getPendingVerifications(@RequestHeader("Authorization") String authHeader) {
        authService.validateTokenAndGetUser(authService.getTokenFromHeader(authHeader));
        return ResponseEntity.ok(userService.getPendingVerifications());
    }

    @PostMapping("/verifications/{userId}/process")
    public ResponseEntity<?> verifyUser(@RequestHeader("Authorization") String authHeader, @PathVariable Long userId, @RequestBody VerifyRequest req) {
        authService.validateTokenAndGetUser(authService.getTokenFromHeader(authHeader));
        String message = userService.processVerification(userId, req);
        return ResponseEntity.ok(Map.of("message", message));
    }
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary(@RequestHeader("Authorization") String authHeader) {
        User staff = authService.validateTokenAndGetUser(authService.getTokenFromHeader(authHeader));
        return ResponseEntity.ok(dashboardService.getSummaryForStaff(staff));
    }
}
