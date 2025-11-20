package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.entity.Booking;
import com.fptu.evstation.rental.evrentalsystem.entity.PaymentMethod;
import com.fptu.evstation.rental.evrentalsystem.entity.User;

public interface PaymentService {
    void autoConfirmDeposit(Long bookingId);
    void createTransaction(Booking booking, Double amount, PaymentMethod paymentMethod, User staff, String note);
}
