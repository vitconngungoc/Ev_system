package com.fptu.evstation.rental.evrentalsystem.controller;

import com.fptu.evstation.rental.evrentalsystem.service.StationService;
import com.fptu.evstation.rental.evrentalsystem.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {
    private final StationService stationService;
    private final VehicleService vehicleService;
    @GetMapping("/station/{stationId}/stats")
    public ResponseEntity<?> getVehicleStatsByStation(@PathVariable Long stationId) {
        Map<String, Object> stats = stationService.getVehicleStatsByStation(stationId);
        return ResponseEntity.ok(stats);
    }
}
