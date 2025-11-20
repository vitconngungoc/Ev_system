package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.dto.CreateVehicleRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.ReportDamageRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateVehicleDetailsRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.VehicleResponse;
import com.fptu.evstation.rental.evrentalsystem.entity.*;

import java.util.List;

public interface VehicleService {

    VehicleResponse createVehicle(CreateVehicleRequest request);
    Vehicle updateVehicle(Long id, UpdateVehicleDetailsRequest request);
    void deleteVehicle(Long id);
    Vehicle getVehicleById(Long vehicleId);
    VehicleResponse getVehicleDetailsById(Long id);
    List<VehicleResponse> getAllVehicles(Long modelId, Long stationId, VehicleType vehicleType, String sortBy, String order);
    Vehicle saveVehicle(Vehicle vehicle);
    Vehicle reportMajorDamage(User staff, Long vehicleId, ReportDamageRequest request);
    VehicleHistory recordVehicleAction(Long vehicleId, Long staffId, Long renterId, Long stationId, VehicleActionType type, String note, String conditionBefore, String conditionAfter, Double battery, Double mileage, String photoPathsJson);
    Vehicle updateVehicleDetails(User staff, Long vehicleId, UpdateVehicleDetailsRequest request);
}