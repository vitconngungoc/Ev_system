package com.fptu.evstation.rental.evrentalsystem.service.impl;


import com.fptu.evstation.rental.evrentalsystem.dto.CreateVehicleRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateVehicleDetailsRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.*;
import com.fptu.evstation.rental.evrentalsystem.repository.VehicleRepository;
import com.fptu.evstation.rental.evrentalsystem.service.ModelService;
import com.fptu.evstation.rental.evrentalsystem.service.StationService;
import com.fptu.evstation.rental.evrentalsystem.service.VehicleService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
}