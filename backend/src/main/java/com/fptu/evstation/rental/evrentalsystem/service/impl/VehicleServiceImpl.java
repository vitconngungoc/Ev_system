package com.fptu.evstation.rental.evrentalsystem.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.evstation.rental.evrentalsystem.dto.CreateVehicleRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.ReportDamageRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateVehicleDetailsRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.VehicleResponse;
import com.fptu.evstation.rental.evrentalsystem.entity.*;
import com.fptu.evstation.rental.evrentalsystem.repository.UserRepository;
import com.fptu.evstation.rental.evrentalsystem.repository.VehicleHistoryRepository;
import com.fptu.evstation.rental.evrentalsystem.repository.VehicleRepository;
import com.fptu.evstation.rental.evrentalsystem.service.ModelService;
import com.fptu.evstation.rental.evrentalsystem.service.StationService;
import com.fptu.evstation.rental.evrentalsystem.service.VehicleService;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleServiceImpl implements VehicleService {
    private final VehicleRepository vehicleRepository;
    private final StationService stationService;
    private final ModelService modelService;
    private final ObjectMapper objectMapper;
    private final VehicleHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final Path damageReportDir = Paths.get(System.getProperty("user.dir"), "uploads", "damage_reports");

    @Override
    public VehicleResponse createVehicle(CreateVehicleRequest request) {
        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new RuntimeException("Biển số xe đã tồn tại!");
        }
        Model model = modelService.getModelById(request.getModelId());
        Station station = stationService.getStationById(request.getStationId());

        Vehicle vehicle = Vehicle.builder()
                .licensePlate(request.getLicensePlate())
                .batteryLevel(request.getBatteryLevel())
                .model(model)
                .station(station)
                .currentMileage(request.getCurrentMileage())
                .status(VehicleStatus.valueOf(request.getStatus()))
                .condition(VehicleCondition.valueOf(request.getCondition()))
                .build();

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        return VehicleResponse.builder()
                .vehicleId(savedVehicle.getVehicleId())
                .licensePlate(savedVehicle.getLicensePlate())
                .batteryLevel(savedVehicle.getBatteryLevel())
                .modelName(model.getModelName())
                .stationName(station.getName())
                .stationId(station.getStationId())
                .currentMileage(savedVehicle.getCurrentMileage())
                .status(savedVehicle.getStatus().name())
                .condition(savedVehicle.getCondition().name())
                .vehicleType(model.getVehicleType())
                .pricePerHour(model.getPricePerHour())
                .seatCount(model.getSeatCount())
                .rangeKm(model.getRangeKm())
                .features(model.getFeatures())
                .description(model.getDescription())
                .imagePaths(getModelImagePaths(model))
                .createdAt(savedVehicle.getCreatedAt())
                .build();
    }

    @Override
    public Vehicle updateVehicle(Long id, UpdateVehicleDetailsRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy xe ID " + id));
        if (request.getLicensePlate() != null)
            vehicle.setLicensePlate(request.getLicensePlate());
        if (request.getCurrentMileage() != null)
            vehicle.setCurrentMileage(request.getCurrentMileage());
        if (request.getBatteryLevel() != null)
            vehicle.setBatteryLevel(request.getBatteryLevel());
        if (request.getNewCondition() != null)
            vehicle.setCondition(request.getNewCondition());
        if (request.getStatus() != null)
            vehicle.setStatus(request.getStatus());
        if (request.getModelId() != null) {
            Model model = modelService.getModelById(request.getModelId());
            vehicle.setModel(model);
        }

        if (request.getStationId() != null) {
            Station station = stationService.getStationById(request.getStationId());
            vehicle.setStation(station);
        }

        return vehicleRepository.save(vehicle);
    }

    @Override
    @Transactional
    public Vehicle saveVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    @Override
    public void deleteVehicle(Long id) {
        Vehicle vehicle = getVehicleById(id);
        if (vehicle.getStatus() == VehicleStatus.RENTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể xóa xe đang RENTED.");
        }
        vehicleRepository.delete(vehicle);
    }

    @Override
    public Vehicle getVehicleById(Long vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe với ID: " + vehicleId));
    }

    @Override
    public VehicleResponse getVehicleDetailsById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy xe với ID: " + id));

        Model model = vehicle.getModel();
        Station station = vehicle.getStation();
        List<String> imagePathsList = getModelImagePaths(model);

        return VehicleResponse.builder()
                .vehicleId(vehicle.getVehicleId())
                .licensePlate(vehicle.getLicensePlate())
                .status(vehicle.getStatus().name())
                .condition(vehicle.getCondition().name())
                .batteryLevel(vehicle.getBatteryLevel())
                .currentMileage(vehicle.getCurrentMileage())
                .modelName(model != null ? model.getModelName() : null)
                .stationId(station != null ? station.getStationId() : null)
                .stationName(station != null ? station.getName() : null)
                .vehicleType(model != null ? model.getVehicleType() : null)
                .pricePerHour(model != null ? model.getPricePerHour() : null)
                .seatCount(model != null ? model.getSeatCount() : null)
                .rangeKm(model != null ? model.getRangeKm() : null)
                .features(model != null ? model.getFeatures() : null)
                .description(model != null ? model.getDescription() : null)
                .imagePaths(imagePathsList)
                .createdAt(vehicle.getCreatedAt())
                .build();
    }

    @Override
    public List<VehicleResponse> getAllVehicles(Long modelId, Long stationId, VehicleType vehicleType, String sortBy, String order) {
        String sortField = "createdAt".equalsIgnoreCase(sortBy) ? "createdAt" : "model.pricePerHour";
        Sort sort = Sort.by(Sort.Direction.fromString((order == null || order.isBlank()) ? "DESC" : order), sortField);

        Specification<Vehicle> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (modelId != null) {
                predicates.add(cb.equal(root.get("model").get("modelId"), modelId));
            }
            if (stationId != null) {
                predicates.add(cb.equal(root.get("station").get("stationId"), stationId));
            }
            if (vehicleType != null) {
                predicates.add(cb.equal(root.get("model").get("vehicleType"), vehicleType));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<Vehicle> vehicles = vehicleRepository.findAll(spec, sort);

        return vehicles.stream().map(vehicle -> {
            Model model = vehicle.getModel();
            return VehicleResponse.builder()
                    .vehicleId(vehicle.getVehicleId())
                    .licensePlate(vehicle.getLicensePlate())
                    .batteryLevel(vehicle.getBatteryLevel())
                    .modelName(model.getModelName())
                    .stationName(vehicle.getStation().getName())
                    .stationId(vehicle.getStation().getStationId())
                    .currentMileage(vehicle.getCurrentMileage())
                    .status(vehicle.getStatus() != null ? vehicle.getStatus().name() : null)
                    .condition(vehicle.getCondition() != null ? vehicle.getCondition().name() : null)
                    .vehicleType(model.getVehicleType())
                    .pricePerHour(model.getPricePerHour())
                    .seatCount(model.getSeatCount())
                    .rangeKm(model.getRangeKm())
                    .features(model.getFeatures())
                    .description(model.getDescription())
                    .imagePaths(getModelImagePaths(model))
                    .build();
        }).toList();
    }

    private List<String> getModelImagePaths(Model model) {
        if (model == null || model.getImagePaths() == null || model.getImagePaths().isBlank()) {
            return new ArrayList<>();
        }
        return List.of(model.getImagePaths().split(","));
    }
    @Override
    @Transactional
    public Vehicle updateVehicleDetails(User staff, Long vehicleId, UpdateVehicleDetailsRequest request) {
        Vehicle vehicle = getVehicleById(vehicleId);

        if (staff.getStation() == null || !vehicle.getStation().getStationId().equals(staff.getStation().getStationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền cập nhật thông tin xe ở trạm khác.");
        }

        if (request.getBatteryLevel() != null) {
            vehicle.setBatteryLevel(request.getBatteryLevel());
            log.info("Cập nhật mức pin cho xe {} thành {}%", vehicle.getLicensePlate(), request.getBatteryLevel());
        }

        if (request.getNewCondition() != null) {
            vehicle.setCondition(request.getNewCondition());
            log.info("Cập nhật tình trạng xe {} thành {}", vehicle.getLicensePlate(), request.getNewCondition());
        }

        return vehicleRepository.save(vehicle);
    }
    @Override
    @Transactional
    public Vehicle reportMajorDamage(User staff, Long vehicleId, ReportDamageRequest request) {
        if (staff.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản nhân viên của bạn đã bị khóa.");
        }

        Vehicle vehicle = getVehicleById(vehicleId);

        if (staff.getStation() == null || !vehicle.getStation().getStationId().equals(staff.getStation().getStationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền báo cáo hư hỏng cho xe ở trạm khác.");
        }

        vehicle.setCondition(VehicleCondition.MAINTENANCE_REQUIRED);
        vehicle.setStatus(VehicleStatus.UNAVAILABLE);

        List<String> photoPaths = new ArrayList<>();
        if (request.getPhotos() != null && !request.getPhotos().isEmpty()) {
            for (int i = 0; i < request.getPhotos().size(); i++) {
                MultipartFile photo = request.getPhotos().get(i);
                String savedPath = saveDamageReportPhoto(photo, vehicleId, i + 1);
                photoPaths.add(savedPath);
            }
        }

        VehicleHistory lastHistory = historyRepository.findFirstByVehicleOrderByActionTimeDesc(vehicle);
        String lastKnownCondition = "Không rõ (Xe mới)";

        if (lastHistory != null) {
            if (lastHistory.getConditionAfter() != null && !lastHistory.getConditionAfter().isBlank()) {
                lastKnownCondition = lastHistory.getConditionAfter();
            }
            else if (lastHistory.getConditionBefore() != null) {
                lastKnownCondition = lastHistory.getConditionBefore();
            }
        }

        try {
            String photoPathsJson = objectMapper.writeValueAsString(photoPaths);
            vehicle.setDamageReportPhotos(photoPathsJson);

            recordVehicleAction(
                    vehicleId,
                    staff.getUserId(),
                    null,
                    staff.getStation().getStationId(),
                    VehicleActionType.MAINTENANCE,
                    request.getDescription(),
                    lastKnownCondition,
                    null,
                    (double) vehicle.getBatteryLevel(),
                    vehicle.getCurrentMileage(),
                    photoPathsJson
            );
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi lưu ảnh hoặc ghi lịch sử báo cáo hư hỏng.", e);
        }

        log.warn("XE HƯ HỎNG NẶNG: Xe {} đã được đưa vào trạng thái bảo trì. Lý do: {}", vehicle.getLicensePlate(), request.getDescription());
        return vehicleRepository.save(vehicle);
    }
    protected String saveDamageReportPhoto(MultipartFile file, Long vehicleId, int index) {
        try {
            Path vehicleDir = damageReportDir.resolve("vehicle_" + vehicleId);
            Files.createDirectories(vehicleDir);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            }
            String fileName = String.format("damage-%d%s", index, extension);
            Path filePath = vehicleDir.resolve(fileName);
            file.transferTo(filePath);

            String relativePath = "/uploads/damage_reports/vehicle_" + vehicleId + "/" + fileName;
            log.info("Đã lưu ảnh báo cáo hư hỏng tại: {}", relativePath);
            return relativePath;

        } catch (IOException e) {
            log.error("Lỗi khi lưu ảnh báo cáo hư hỏng cho xe ID: " + vehicleId, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống khi lưu ảnh báo cáo.");
        }
    }

    @Override
    public VehicleHistory recordVehicleAction(Long vehicleId, Long staffId, Long renterId,Long stationId, VehicleActionType type, String note, String conditionBefore, String conditionAfter, Double battery, Double mileage, String photoPathsJson) {

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe"));
        User staff = staffId != null ? userRepository.findById(staffId).orElse(null) : null;
        User renter = renterId != null ? userRepository.findById(renterId).orElse(null) : null;
        Station station = stationId != null ? stationService.getStationById(stationId) : null;

        VehicleHistory history = VehicleHistory.builder()
                .vehicle(vehicle)
                .staff(staff)
                .renter(renter)
                .station(station)
                .actionType(type)
                .note(note)
                .conditionBefore(conditionBefore)
                .conditionAfter(conditionAfter)
                .batteryLevel(battery)
                .mileage(mileage)
                .photoPaths(photoPathsJson)
                .build();

        return historyRepository.save(history);
    }
}