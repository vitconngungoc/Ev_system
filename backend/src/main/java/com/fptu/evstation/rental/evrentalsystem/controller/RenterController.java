package com.fptu.evstation.rental.evrentalsystem.controller;

import com.fptu.evstation.rental.evrentalsystem.dto.BookingSummaryResponse;
import com.fptu.evstation.rental.evrentalsystem.entity.User;
import com.fptu.evstation.rental.evrentalsystem.service.AuthService;
import com.fptu.evstation.rental.evrentalsystem.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/renter")
@RequiredArgsConstructor
public class RenterController {
    private final AuthService authService;
    private final BookingService bookingService;

    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingSummaryResponse>> getMyBookings(
            @RequestHeader("Authorization") String authHeader) {

        User renter = authService.validateTokenAndGetUser(authService.getTokenFromHeader(authHeader));

        List<BookingSummaryResponse> myBookings = bookingService.getMyBookings(renter);

        return ResponseEntity.ok(myBookings);
    }
}