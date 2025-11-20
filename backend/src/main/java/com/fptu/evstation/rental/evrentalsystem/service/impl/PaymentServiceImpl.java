package com.fptu.evstation.rental.evrentalsystem.service.impl;

import com.fptu.evstation.rental.evrentalsystem.entity.*;
import com.fptu.evstation.rental.evrentalsystem.repository.BookingRepository;
import com.fptu.evstation.rental.evrentalsystem.repository.TransactionRepository;
import com.fptu.evstation.rental.evrentalsystem.service.PaymentService;
import com.fptu.evstation.rental.evrentalsystem.service.VehicleService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {
    private final BookingRepository bookingRepository;
    private final TransactionRepository transactionRepository;
    private final VehicleService vehicleService;

    @Override
    @Transactional
    public void autoConfirmDeposit(Long bookingId) {
        Booking before = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Booking."));
        BookingStatus beforeStatus = before.getStatus();
        boolean beforePaid = before.isReservationDepositPaid();

        Booking after = confirmDepositLogic(bookingId);

        if (beforeStatus == BookingStatus.PENDING
                && after.getStatus() == BookingStatus.CONFIRMED
                && !beforePaid
                && after.isReservationDepositPaid()) {
            createTransaction(
                    after,
                    500_000.0,
                    PaymentMethod.GATEWAY,
                    null,
                    "Hệ thống tự động xác nhận cọc 500k (payOS)"
            );
        }
    }

    private Booking confirmDepositLogic(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Booking."));

        if (booking.getStatus() != BookingStatus.PENDING) {
            if (booking.getStatus() == BookingStatus.CONFIRMED) {
                log.warn("Booking {} đã được xác nhận trước đó (có thể do webhook gọi lại).", bookingId);
                return booking;
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking này không ở trạng thái chờ thanh toán cọc.");
        }

        Vehicle vehicle = booking.getVehicle();
        if (vehicle == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Booking này bị lỗi: không tìm thấy thông tin xe.");
        }

        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            log.warn("Xe {} đã bị đặt bởi một giao dịch khác.", vehicle.getVehicleId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Xe này vừa được người khác đặt. Vui lòng hủy booking và tạo lại.");
        }

        vehicle.setStatus(VehicleStatus.RESERVED);
        vehicleService.saveVehicle(vehicle);

        booking.setReservationDepositPaid(true);
        booking.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public void createTransaction(Booking booking, Double amount, PaymentMethod paymentMethod, User staff, String note) {
        Transaction transaction = Transaction.builder()
                .booking(booking)
                .amount(amount)
                .paymentMethod(paymentMethod)
                .transactionDate(LocalDateTime.now())
                .staff(staff)
                .staffNote(note)
                .build();
        transactionRepository.save(transaction);
    }
}
