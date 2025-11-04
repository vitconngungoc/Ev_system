package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.dto.CreateVehicleRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateVehicleDetailsRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.VehicleResponse;
import com.fptu.evstation.rental.evrentalsystem.entity.Vehicle;

import java.util.List;

public interface VehicleService {

    Vehicle createVehicle(CreateVehicleRequest request);
    Vehicle updateVehicle(Long id, UpdateVehicleDetailsRequest request);
    void deleteVehicle(Long id);
    Vehicle getVehicleById(Long vehicleId);
    VehicleResponse getVehicleDetailsById(Long id);
    List<VehicleResponse> getAllVehicles(Long modelId, Long stationId, String vehicleType, String sortBy, String order);
}