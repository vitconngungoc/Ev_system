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
    public void confirmDeposit(User staff, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Booking."));

        if (staff.getStation() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản nhân viên của bạn chưa được gán cho trạm nào.");
        }
        if (!booking.getStation().getStationId().equals(staff.getStation().getStationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên đơn hàng của trạm khác.");
        }

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn này đã được xác nhận cọc trước đó (có thể qua PayOS).");
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể xác nhận cọc cho đơn ở trạng thái PENDING.");
        }

        Booking confirmedBooking = confirmDepositLogic(bookingId);
        createTransaction(
                confirmedBooking,
                500_000.0,
                PaymentMethod.BANK_TRANSFER,
                staff,
                "Nhân viên xác nhận cọc giữ chỗ 500k"
        );
    }

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

    @Override
    @Transactional
    public void autoConfirmRentalDeposit(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Webhook 2%: Không tìm thấy Booking."));

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            log.warn("Webhook 2% nhận được cho booking {} nhưng trạng thái không phải CONFIRMED (status={}). Bỏ qua.", bookingId, booking.getStatus());
            return;
        }

        if (booking.isRentalDepositPaid()) {
            log.warn("Webhook 2% nhận được cho booking {} nhưng cọc 2% đã được thanh toán trước đó. Bỏ qua.", bookingId);
            return;
        }

        if (booking.getRentalDeposit() == null || booking.getRentalDeposit() <= 0) {
            log.error("Webhook 2% cho booking {} thất bại: không tìm thấy số tiền cọc 2% (RentalDeposit).", bookingId);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi logic: Không tìm thấy số tiền cọc 2%");
        }

        booking.setRentalDepositPaid(true);
        bookingRepository.save(booking);

        createTransaction(
                booking,
                booking.getRentalDeposit(),
                PaymentMethod.GATEWAY,
                null,
                "Hệ thống tự động xác nhận cọc thuê xe 2% (payOS)"
        );

        log.info("Hệ thống tự động xác nhận cọc 2% (PayOS) thành công cho Booking ID: {}", bookingId);
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
