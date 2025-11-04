package com.fptu.evstation.rental.evrentalsystem.dto;

import lombok.Data;

@Data
public class CreateVehicleRequest {
    private String licensePlate;
    private Integer batteryLevel;
    private Long modelId;
    private Long stationId;
    private Double currentMileage;
    private String status;
    private String condition;
}
