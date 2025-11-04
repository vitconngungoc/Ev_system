package com.fptu.evstation.rental.evrentalsystem.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ModelResponse {
    private Long modelId;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
