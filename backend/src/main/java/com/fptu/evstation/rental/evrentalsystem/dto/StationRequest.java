package com.fptu.evstation.rental.evrentalsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data

public class StationRequest {
    private String name;
    private String address;
    private String description;
    private String openingHours;
    private String hotline;
}