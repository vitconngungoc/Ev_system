package com.fptu.evstation.rental.evrentalsystem.controller;

import com.fptu.evstation.rental.evrentalsystem.service.StationService;
import com.fptu.evstation.rental.evrentalsystem.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {
    private final StationService stationService;
    private final VehicleService vehicleService;
}
