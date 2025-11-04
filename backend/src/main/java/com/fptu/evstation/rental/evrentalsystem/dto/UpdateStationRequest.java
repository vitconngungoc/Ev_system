package com.fptu.evstation.rental.evrentalsystem.dto;

import lombok.Data;

@Data
public class UpdateStationRequest {
    private String name;
    private String address;
    private String description;
    private String openingHours;
    private String hotline;
    private String status;
}