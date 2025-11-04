package com.fptu.evstation.rental.evrentalsystem.dto;

import lombok.Data;

@Data
public class CreateModelRequest {
    private String modelName;
    private String vehicleType;
    private Integer seatCount;
    private Double batteryCapacity;
    private Double rangeKm;
    private String features;
    private Double pricePerHour;
    private Double initialValue;
    private String description;

}