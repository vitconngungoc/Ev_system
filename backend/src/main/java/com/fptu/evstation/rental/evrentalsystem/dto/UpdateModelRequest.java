package com.fptu.evstation.rental.evrentalsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateModelRequest {
    private String modelName;
    private String vehicleType;
    private Integer seatCount;
    private Double batteryCapacity;
    private Double rangeKm;
    private Double pricePerHour;
    private Double initialValue;
    private String features;
    private String description;
    private List<String> imagePaths;
}
