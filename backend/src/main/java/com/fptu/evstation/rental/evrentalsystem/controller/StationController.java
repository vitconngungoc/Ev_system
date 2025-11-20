package com.fptu.evstation.rental.evrentalsystem.controller;

import com.fptu.evstation.rental.evrentalsystem.entity.Station;
import com.fptu.evstation.rental.evrentalsystem.entity.StationStatus;
import com.fptu.evstation.rental.evrentalsystem.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
@RestController
@RequestMapping("/api/stations")
@RequiredArgsConstructor
public class StationController {
    private final StationService stationService;

    @GetMapping
    public ResponseEntity<List<Station>> getAllPublicStations() {
        return ResponseEntity.ok(stationService.getAllStations());
    }

    @GetMapping("/{stationId}")
    public ResponseEntity<Station> getPublicStationDetail(@PathVariable Long stationId) {
        Station station = stationService.getStationById(stationId);
        if (!StationStatus.ACTIVE.equals(station.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy trạm với ID: " + stationId);
        }
        return ResponseEntity.ok(station);
    }
}
