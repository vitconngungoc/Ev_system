package com.fptu.evstation.rental.evrentalsystem.service.impl;

import com.fptu.evstation.rental.evrentalsystem.dto.CreateVehicleRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateVehicleDetailsRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.VehicleResponse;
import com.fptu.evstation.rental.evrentalsystem.entity.*;
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
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleServiceImpl implements VehicleService {
    private final VehicleRepository vehicleRepository;
    private final StationService stationService;
    private final ModelService modelService;


    @Override
    @Transactional
    public Vehicle createVehicle(CreateVehicleRequest request) {
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
        return vehicleRepository.save(vehicle);
    }

    @Override
    @Transactional
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe"));
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
    public List<VehicleResponse> getAllVehicles(Long modelId, Long stationId, String vehicleType, String sortBy, String order) {
        String trimmedVehicleType = (vehicleType != null) ? vehicleType.trim() : null;
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
            if (trimmedVehicleType != null && !trimmedVehicleType.isBlank() && !"ALL".equalsIgnoreCase(trimmedVehicleType)) {
                predicates.add(cb.equal(root.get("model").get("vehicleType"), trimmedVehicleType));
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
}