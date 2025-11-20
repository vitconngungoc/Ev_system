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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import vn.payos.PayOS;
import vn.payos.exception.PayOSException;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final PaymentService paymentService;
    private final VehicleService vehicleService;
    private final PayOS payOS;
    private final ObjectMapper objectMapper;
    private final ContractService contractService;
    private final Random random = new Random();
    private final StationService stationService;

    private final Path handoverPhotoDir = Paths.get(System.getProperty("user.dir"), "uploads", "handover_photos");

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

    @Override
    public List<BookingSummaryResponse> getAllBookingsByStation(User staff, String keyword, String status, String date) {
        if (staff.getStation() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nhân viên chưa được gán cho trạm nào.");
        }
        List<Booking> bookings = bookingRepository.findAllByStationWithDetails(staff.getStation(), Sort.by(Sort.Direction.DESC, "createdAt"));

        Stream<Booking> stream = bookings.stream();

        if (keyword != null && !keyword.isBlank()) {
            String likePattern = keyword.toLowerCase();
            stream = stream.filter(b ->
                    (b.getUser().getFullName() != null && b.getUser().getFullName().toLowerCase().contains(likePattern)) ||
                            (b.getUser().getPhone() != null && b.getUser().getPhone().contains(likePattern))
            );
        }

        if (status != null && !status.isBlank()) {
            try {
                BookingStatus bookingStatus = BookingStatus.valueOf(status.toUpperCase());
                stream = stream.filter(b -> b.getStatus() == bookingStatus);
            } catch (IllegalArgumentException e) {

            }
        }

        return stream.map(b -> {
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

    @Override
    public Map<String, Object> initiateCheckIn(Long bookingId, User staff) {
        Booking booking = getBookingById(bookingId);
        if (staff.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản nhân viên của bạn đã bị khóa.");
        }
        if (staff.getStation() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nhân viên chưa được gán cho trạm nào.");
        }
        if (!booking.getStation().getStationId().equals(staff.getStation().getStationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên đơn hàng của trạm khác.");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking này không ở trạng thái sẵn sàng để check-in.");
        }

        Model model = booking.getVehicle().getModel();
        double rentalDepositAmount = model.getInitialValue() * 0.02;

        booking.setRentalDeposit(rentalDepositAmount);
        bookingRepository.save(booking);

        try {
            final String description = "Cọc 2% cho Booking " + booking.getBookingId();
            final String returnUrl = "http://localhost:3000/payment-success";
            final String cancelUrl = "http://localhost:3000/payment-failed";
            final long amount = (long) 2000.0;

            String randomSuffix = String.format("%04d", random.nextInt(10000));
            final long orderCode = Long.parseLong("2" + booking.getBookingId() + randomSuffix);

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(amount)
                    .description(description)
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .build();

            CreatePaymentLinkResponse paymentResult = payOS.paymentRequests().create(paymentData);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Đã tạo link thanh toán cọc thuê xe 2%. Vui lòng đưa khách thanh toán.");
            response.put("rentalDepositAmount", rentalDepositAmount);
            response.put("paymentUrl", paymentResult.getCheckoutUrl());

            return response;

        } catch (PayOSException e) {
            log.error("Lỗi khi tạo link thanh toán cọc 2% (PayOS): {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo link thanh toán cọc 2%: " + e.getMessage());
        }
    }

    @Override
    public Contract processCheckIn(Long bookingId, CheckInRequest req, User staff) {
        if (staff.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản nhân viên của bạn đã bị khóa.");
        }

        if (staff.getStation() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nhân viên chưa được gán cho trạm nào.");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt xe."));

        if (!booking.getStation().getStationId().equals(staff.getStation().getStationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên đơn hàng của trạm khác.");
        }

        if (booking.getStatus() == BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn đặt xe này chưa được xác nhận thanh toán phí giữ chỗ.");
        }else if(booking.getStatus() == BookingStatus.RENTING){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn đặt xe này đã được thuê.");
        }else if(booking.getStatus() == BookingStatus.COMPLETED){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn đặt xe này đã được hoàn thành.");
        }else if(booking.getStatus() == BookingStatus.CANCELLED){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn đặt xe này đã bị hủy.");
        }

        Vehicle vehicle = booking.getVehicle();

        if (req.getBattery() < 85) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Mức pin hiện tại chỉ có " + req.getBattery() + "%, không đủ mức pin tối thiểu 85% để giao xe cho khách thuê. " +
                            "Vui lòng sạc xe trước khi giao cho khách.");
        }

        if (req.getMileage() < vehicle.getCurrentMileage()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Số km hiện tại bạn nhập (" + req.getMileage() + " km) không hợp lệ. " +
                            "Số km trên hệ thống là " + vehicle.getCurrentMileage() + " km. " +
                            "Vui lòng kiểm tra lại và nhập số km lớn hơn hoặc bằng số km hiện tại trên hệ thống.");
        }

        vehicle.setBatteryLevel(req.getBattery());
        vehicle.setCurrentMileage(req.getMileage());
        vehicle.setStatus(VehicleStatus.RENTED);
        vehicleService.saveVehicle(vehicle);

        if (req.getCheckInPhotos() == null || req.getCheckInPhotos().isEmpty() || req.getCheckInPhotos().get(0).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh check-in (lúc giao xe) là bắt buộc.");
        }


        double rentalDepositAmount = booking.getVehicle().getModel().getInitialValue() * 0.02;
        if (!booking.isRentalDepositPaid()) {
            log.info("Booking {} chưa trả cọc 2% qua PayOS. Xử lý thanh toán thủ công...", bookingId);

            if (req.getDepositPaymentMethod() == PaymentMethod.GATEWAY) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thanh toán qua cổng PayOS chưa được xác nhận. Vui lòng đợi hoặc chọn phương thức thanh toán thủ công (Tiền mặt/Chuyển khoản).");
            }

            paymentService.createTransaction(booking, rentalDepositAmount, req.getDepositPaymentMethod(), staff, "Thu cọc thuê xe 2% (thủ công)");
            booking.setRentalDepositPaid(true);

        } else {
            log.info("Booking {} đã trả cọc 2% qua PayOS. Bỏ qua tạo giao dịch 2%...", bookingId);
        }

        List<String> photoPaths = new ArrayList<>();
        String photoPathsJson = null;
        for (int i = 0; i < req.getCheckInPhotos().size(); i++) {
            MultipartFile photo = req.getCheckInPhotos().get(i);
            String savedPath = saveHandoverPhoto(photo, bookingId, "checkin", i + 1);
            photoPaths.add(savedPath);
        }

        try {
            photoPathsJson = objectMapper.writeValueAsString(photoPaths);
            booking.setCheckInPhotoPaths(photoPathsJson);
        } catch (Exception e) {
            log.error("Lỗi khi chuyển đổi danh sách ảnh thành JSON", e);
        }

        booking.setRentalDeposit(rentalDepositAmount);
        booking.setStartDate(LocalDateTime.now());
        booking.setStatus(BookingStatus.RENTING);
        bookingRepository.save(booking);

        Contract contract = contractService.generateAndSaveContract(booking, staff);
        try {
            vehicleService.recordVehicleAction(
                    booking.getVehicle().getVehicleId(),
                    staff.getUserId(),
                    booking.getUser().getUserId(),
                    staff.getStation().getStationId(),
                    VehicleActionType.DELIVERY,
                    "Nhân viên " + staff.getFullName() + " đã giao xe cho khách " + booking.getUser().getFullName(),
                    req.getConditionBefore(),
                    null,
                    req.getBattery(),
                    req.getMileage(),
                    photoPathsJson
            );
        } catch (Exception e) {
            log.warn("Không thể ghi lịch sử giao xe cho booking ID {}: {}", bookingId, e.getMessage());
        }
        log.info("Check-in thành công cho Booking ID: {}", bookingId);
        return contract;
    }

    @Transactional
    public String saveHandoverPhoto(MultipartFile file, Long bookingId, String type, int index) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh bàn giao không được để trống.");
        }
        try {
            Path bookingDir = handoverPhotoDir.resolve("booking_" + bookingId);
            Files.createDirectories(bookingDir);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            }
            String fileName = String.format("%s-%d%s", type, index, extension);
            Path filePath = bookingDir.resolve(fileName);
            file.transferTo(filePath);

            return "/uploads/handover_photos/booking_" + bookingId + "/" + fileName;

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống khi lưu ảnh.");
        }
    }
    public Map<String, Object> getPeakHourStatistics(Long stationId, LocalDate fromDate, LocalDate toDate) {
        LocalDateTime from = (fromDate != null) ? fromDate.atStartOfDay() : LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime to = (toDate != null) ? toDate.atTime(23, 59, 59) : LocalDate.now().atTime(23, 59, 59);

        List<Booking> bookings;

        if (stationId != null) {
            Station station = stationService.getStationById(stationId);
            bookings = bookingRepository.findAllByStationAndStartDateBetween(station, from, to);
        } else {
            bookings = bookingRepository.findAllByStartDateBetween(from, to);
        }

        Map<Integer, Long> countByHour = new HashMap<>();
        for (Booking b : bookings) {
            int hour = b.getStartDate().getHour();
            countByHour.put(hour, countByHour.getOrDefault(hour, 0L) + 1);
        }

        long total = countByHour.values().stream().mapToLong(Long::longValue).sum();
        int peakHour = countByHour.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(-1);

        List<Map<String, Object>> hourlyStats = new ArrayList<>();
        long peakValue = countByHour.getOrDefault(peakHour, 0L);

        for (int i = 0; i < 24; i++) {
            long rented = countByHour.getOrDefault(i, 0L);
            double percent = (peakValue == 0) ? 0 : (rented * 100.0 / peakValue);

            Map<String, Object> item = new HashMap<>();
            item.put("hourRange", String.format("%02d:00 - %02d:00", i, (i + 1) % 24));
            item.put("rentedVehicles", rented);
            item.put("percentOfPeak", percent);
            hourlyStats.add(item);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("scope", stationId == null ? "Tất cả các trạm" : "Trạm ID " + stationId);
        result.put("fromDate", from.toLocalDate());
        result.put("toDate", to.toLocalDate());
        result.put("totalRentals", total);
        result.put("peakHour", peakHour == -1 ? "Không có dữ liệu" :
                String.format("%02d:00 - %02d:00", peakHour, (peakHour + 1) % 24));
        result.put("data", hourlyStats);

        return result;
    }
}
