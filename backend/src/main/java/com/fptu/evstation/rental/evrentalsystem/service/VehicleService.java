package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.dto.CreateVehicleRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateVehicleDetailsRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.VehicleResponse;
import com.fptu.evstation.rental.evrentalsystem.entity.Vehicle;
import com.fptu.evstation.rental.evrentalsystem.entity.VehicleActionType;
import com.fptu.evstation.rental.evrentalsystem.entity.VehicleHistory;
import com.fptu.evstation.rental.evrentalsystem.entity.VehicleType;

import java.util.List;

public interface VehicleService {

    VehicleResponse createVehicle(CreateVehicleRequest request);
    Vehicle updateVehicle(Long id, UpdateVehicleDetailsRequest request);
    void deleteVehicle(Long id);
    Vehicle getVehicleById(Long vehicleId);
    VehicleResponse getVehicleDetailsById(Long id);
    List<VehicleResponse> getAllVehicles(Long modelId, Long stationId, VehicleType vehicleType, String sortBy, String order);
    VehicleHistory recordVehicleAction(Long vehicleId, Long staffId, Long renterId, Long stationId, VehicleActionType type, String note, String conditionBefore, String conditionAfter, Integer battery, Double mileage, String photoPathsJson);
    Vehicle saveVehicle(Vehicle vehicle);
}