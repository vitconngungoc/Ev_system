package com.fptu.evstation.rental.evrentalsystem.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.evstation.rental.evrentalsystem.dto.*;
import com.fptu.evstation.rental.evrentalsystem.entity.*;
import com.fptu.evstation.rental.evrentalsystem.repository.*;
import com.fptu.evstation.rental.evrentalsystem.service.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import vn.payos.PayOS;
import vn.payos.exception.PayOSException;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleService vehicleService;
    private final PayOS payOS;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    private static final long MIN_RENTAL_HOURS = 1;

    @Override
    @Transactional
    public Map<String, Object> createBooking(User renter, BookingRequest req) {

        if (renter.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ trạm.");
        }

        if (!req.isAgreedToTerms()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn phải đồng ý với các điều khoản và điều kiện thuê xe.");
        }

        Duration rentalDuration = Duration.between(req.getStartTime(), req.getEndTime());

        if (rentalDuration.isNegative() || rentalDuration.isZero()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian trả xe phải sau thời gian nhận xe.");
        }

        LocalDateTime now = LocalDateTime.now();

        LocalDateTime oneWeekLater = now.plusDays(2).with(LocalTime.MAX);
        if (req.getStartTime().isBefore(now) || req.getStartTime().isAfter(oneWeekLater)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn chỉ có thể đặt xe trong vòng 2 ngày tới.");
        }


        if (rentalDuration.toHours() < MIN_RENTAL_HOURS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian thuê tối thiểu là " + MIN_RENTAL_HOURS + " giờ.");
        }

        if (renter.getVerificationStatus() != VerificationStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản của bạn chưa được xác minh để có thể đặt xe.");
        }

        List<BookingStatus> activeStatuses = List.of(BookingStatus.PENDING ,BookingStatus.CONFIRMED, BookingStatus.RENTING);
        long userActiveBookings = bookingRepository.countByUserAndStatusIn(renter, activeStatuses);

        if (userActiveBookings >= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn đã có một đơn đặt xe đang hoạt động. Vui lòng hoàn thành đơn hiện tại trước khi đặt xe mới.");
        }

        Vehicle vehicle = vehicleService.getVehicleById(req.getVehicleId());

        if (vehicle.getBatteryLevel() < 85) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Pin của xe hiện tại chỉ còn " + vehicle.getBatteryLevel() + "%, không đủ để đảm bảo chuyến đi của bạn. " +
                            "Vui lòng chọn xe khác hoặc chờ 1-2 ngày để xe được sạc đầy.");
        }

        Station station = vehicle.getStation();
        Model model = vehicle.getModel();

        if (!StationStatus.ACTIVE.equals(station.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạm " + station.getName() + " hiện không hoạt động, không thể đặt xe.");
        }

        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Xe không khả dụng hoặc đã được thuê.");
        }

        long totalVehiclesOfModel = vehicleRepository.countByModelAndStation(model, station);
        if (totalVehiclesOfModel == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạm này không có loại xe bạn chọn.");
        }

        List<BookingStatus> excludedStatuses = List.of(BookingStatus.CANCELLED, BookingStatus.COMPLETED, BookingStatus.CANCELLED_AWAIT_REFUND, BookingStatus.REFUNDED);
        long conflicts = bookingRepository.countOverlappingBookingsForVehicle(
                vehicle, req.getStartTime(), req.getEndTime(), excludedStatuses
        );

        if (conflicts > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Xe này đã bị đặt trong khung giờ bạn chọn. Vui lòng thử lại.");
        }

        double totalRentalCost = model.getPricePerHour() * rentalDuration.toHours();

        Booking booking = Booking.builder()
                .user(renter)
                .station(station)
                .vehicle(vehicle)
                .startDate(req.getStartTime())
                .endDate(req.getEndTime())
                .finalFee(totalRentalCost)
                .status(BookingStatus.PENDING)
                .build();
        booking = bookingRepository.save(booking);

        try {
            final String description = "Thanh toán 500K giữ xe";
            final String returnUrl = "http://localhost:3000/payment-success";
            final String cancelUrl = "http://localhost:3000/payment-failed";
            final long amount = 2000L;
            final long bookingId = booking.getBookingId();

            String randomSuffix = String.format("%04d", random.nextInt(10000));
            final long orderCode = Long.parseLong("1" + bookingId + randomSuffix);

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(amount)
                    .description(description)
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .build();
            CreatePaymentLinkResponse paymentResult = payOS.paymentRequests().create(paymentData);

            return Map.of(
                    "message", "Yêu cầu đặt xe thành công. Vui lòng thanh toán cọc 500.000 VNĐ.",
                    "bookingId", booking.getBookingId(),
                    "paymentUrl", paymentResult.getCheckoutUrl()
            );
        } catch (PayOSException e) {
            log.error("Lỗi khi tạo link thanh toán payOS: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo link thanh toán: " + e.getMessage());
        } catch (Exception e_general) {
            log.error("Lỗi hệ thống: {}", e_general.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống không xác định.");
        }
    }

    @Override
    public Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt xe."));
    }

    @Override
    public BookingDetailResponse getBookingDetailsById(Long bookingId) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "Chức năng đang được phát triển");
    }

    @Override
    public List<BookingSummaryResponse> getMyBookings(User renter) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");

        List<Booking> bookings = bookingRepository.findByUserWithDetails(renter, sort);

        return bookings.stream()
                .map(b -> {
                    String licensePlate = "Chưa nhận xe";
                    String modelName = "N/A";
                    VehicleStatus vehicleStatus = null;
                    Integer batteryLevel = null;
                    Double currentMileage = null;

                    Vehicle vehicle = b.getVehicle();

                    if (vehicle != null) {
                        licensePlate = vehicle.getLicensePlate();
                        vehicleStatus = vehicle.getStatus();
                        batteryLevel = vehicle.getBatteryLevel();
                        currentMileage = vehicle.getCurrentMileage();
                        if (vehicle.getModel() != null) {
                            modelName = vehicle.getModel().getModelName();
                        }
                    }

                    return BookingSummaryResponse.builder()
                            .bookingId(b.getBookingId())
                            .renterName(b.getUser().getFullName())
                            .vehicleLicensePlate(licensePlate)
                            .modelName(modelName)
                            .vehicleStatus(vehicleStatus)
                            .bookingStatus(b.getStatus())
                            .batteryLevel(batteryLevel)
                            .currentMileage(currentMileage)
                            .createdAt(b.getCreatedAt())
                            .startDate(b.getStartDate())
                            .build();
                })
                .toList();
    }

}
