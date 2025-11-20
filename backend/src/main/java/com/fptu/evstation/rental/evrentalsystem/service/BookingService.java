package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.dto.BookingDetailResponse;
import com.fptu.evstation.rental.evrentalsystem.dto.BookingRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.BookingSummaryResponse;
import com.fptu.evstation.rental.evrentalsystem.entity.Booking;
import com.fptu.evstation.rental.evrentalsystem.entity.User;

import java.util.List;
import java.util.Map;

public interface BookingService {
    Map<String, Object> createBooking(User renter, BookingRequest req);
    Booking getBookingById(Long bookingId);
    BookingDetailResponse getBookingDetailsById(Long bookingId);
    List<BookingSummaryResponse> getMyBookings(User renter);
}

