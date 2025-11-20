package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.dto.*;
import com.fptu.evstation.rental.evrentalsystem.entity.*;
import com.fptu.evstation.rental.evrentalsystem.dto.CreateVehicleRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateVehicleDetailsRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.VehicleResponse;
import com.fptu.evstation.rental.evrentalsystem.entity.Vehicle;
import com.fptu.evstation.rental.evrentalsystem.entity.VehicleActionType;
import com.fptu.evstation.rental.evrentalsystem.entity.VehicleHistory;
import com.fptu.evstation.rental.evrentalsystem.entity.VehicleType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface VehicleService {
    VehicleResponse createVehicle(CreateVehicleRequest request);
    Vehicle updateVehicle(Long id, UpdateVehicleDetailsRequest request);
    void deleteVehicle(Long id);
    Vehicle getVehicleById(Long vehicleId);
    VehicleResponse getVehicleDetailsById(Long id);
    List<VehicleResponse> getAllVehicles(Long modelId, Long stationId, VehicleType vehicleType, String sortBy, String order);
    List<VehicleResponse> getVehiclesByModelAndStation(Long modelId, Long stationId, User requestingUser);
    VehicleHistory recordVehicleAction(Long vehicleId, Long staffId, Long renterId, Long stationId, VehicleActionType type, String note, String conditionBefore, String conditionAfter, Integer battery, Double mileage, String photoPathsJson);
    Vehicle saveVehicle(Vehicle vehicle);
    Vehicle reportMajorDamage(User staff, Long vehicleId, ReportDamageRequest request);
    Vehicle updateVehicleDetails(User staff, Long vehicleId, UpdateVehicleDetailsRequest request);
    List<VehicleHistoryResponse> getVehicleHistory(Long stationId, LocalDate from, LocalDate to, VehicleType vehicleType, String licensePlate);
    List<VehicleHistoryResponse> getHistoryByVehicle(Long vehicleId);
    List<VehicleHistoryResponse> getHistoryByRenter(Long renterId);
    Map<String, Object> checkVehicleSchedule(Long vehicleId, LocalDateTime startTime, LocalDateTime endTime);
    List<VehicleAvailabilityResponse> getAvailableVehiclesByModel(Long modelId, Long stationId, LocalDateTime startTime, LocalDateTime endTime);
}