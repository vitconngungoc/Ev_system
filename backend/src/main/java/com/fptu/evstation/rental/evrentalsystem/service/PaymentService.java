package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.dto.BillResponse;
import com.fptu.evstation.rental.evrentalsystem.dto.PaymentConfirmationRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.PenaltyCalculationRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.Booking;
import com.fptu.evstation.rental.evrentalsystem.entity.PaymentMethod;
import com.fptu.evstation.rental.evrentalsystem.entity.User;

import java.util.Map;

public interface PaymentService {
    BillResponse calculateFinalBill(User staff, Long bookingId, PenaltyCalculationRequest req);
    Map<String, Object> confirmFinalPayment(Long bookingId, PaymentConfirmationRequest req, User staff);
    void confirmDeposit(User staff, Long bookingId);
    void autoConfirmDeposit(Long bookingId);
    void createTransaction(Booking booking, Double amount, PaymentMethod paymentMethod, User staff, String note);
    void autoConfirmRentalDeposit(Long bookingId);
}
