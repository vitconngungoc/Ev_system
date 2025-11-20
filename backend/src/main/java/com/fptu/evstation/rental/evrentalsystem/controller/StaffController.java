package com.fptu.evstation.rental.evrentalsystem.controller;

import com.fptu.evstation.rental.evrentalsystem.dto.*;
import com.fptu.evstation.rental.evrentalsystem.entity.Contract;
import com.fptu.evstation.rental.evrentalsystem.entity.User;
import com.fptu.evstation.rental.evrentalsystem.service.*;
import com.fptu.evstation.rental.evrentalsystem.service.impl.UserServiceImpl;
import jakarta.validation.Valid;
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
    private final PaymentService paymentService;
    private final BookingService bookingService;
    private final ContractService contractService;
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

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingSummaryResponse>> getAllBookings(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date) {
        User staff = authService.validateTokenAndGetUser(authService.getTokenFromHeader(authHeader));
        return ResponseEntity.ok(bookingService.getAllBookingsByStation(staff, keyword, status, date));
    }

    @PostMapping("/bookings/{bookingId}/confirm-deposit")
    public ResponseEntity<?> confirmDeposit(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long bookingId) {

        User staff = authService.validateTokenAndGetUser(authService.getTokenFromHeader(authHeader));

        paymentService.confirmDeposit(staff, bookingId);

        return ResponseEntity.ok(Map.of(
                "message", "Xác nhận cọc 500k thành công. Xe đã được giữ chỗ."
        ));
    }

    @PostMapping("/rentals/initiate-check-in/{bookingId}")
    public ResponseEntity<?> initiateCheckIn(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long bookingId) {
        User staff = authService.validateTokenAndGetUser(authService.getTokenFromHeader(authHeader));
        Map<String, Object> result = bookingService.initiateCheckIn(bookingId, staff);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/rentals/check-in/{bookingId}")
    public ResponseEntity<?> checkIn(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long bookingId,
            @Valid @ModelAttribute CheckInRequest req) {
        String token = authService.getTokenFromHeader(authHeader);
        User staff = authService.validateTokenAndGetUser(token);

        Contract contract = bookingService.processCheckIn(bookingId, req, staff);

        return ResponseEntity.ok(Map.of(
                "message", "Check-in thành công. Đã thu cọc thuê xe và tạo hợp đồng.",
                "contractUrl", contract.getContractPdfPath()
        ));
    }

    @GetMapping("/contracts")
    public ResponseEntity<List<ContractSummaryResponse>> getAllContracts(@RequestHeader("Authorization") String authHeader) {
        User staff = authService.validateTokenAndGetUser(authService.getTokenFromHeader(authHeader));
        return ResponseEntity.ok(contractService.getAllContractsByStation(staff));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary(@RequestHeader("Authorization") String authHeader) {
        User staff = authService.validateTokenAndGetUser(authService.getTokenFromHeader(authHeader));
        return ResponseEntity.ok(dashboardService.getSummaryForStaff(staff));
    }
}
