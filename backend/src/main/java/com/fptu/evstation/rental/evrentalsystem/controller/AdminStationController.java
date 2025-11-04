package com.fptu.evstation.rental.evrentalsystem.controller;

import com.fptu.evstation.rental.evrentalsystem.dto.CreateModelRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.StationRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateModelRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateStationRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.Model;
import com.fptu.evstation.rental.evrentalsystem.entity.Station;
import com.fptu.evstation.rental.evrentalsystem.service.ModelService;
import com.fptu.evstation.rental.evrentalsystem.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminStationController {

    private final StationService stationService;
    private final ModelService modelService;

    @PostMapping("/stations")
    public ResponseEntity<Station> createStation(@RequestBody StationRequest request) {
        return ResponseEntity.ok(stationService.addStation(request));
    }

    @GetMapping("/stations")
    public ResponseEntity<List<Station>> getAllStations() {
        return ResponseEntity.ok(stationService.getAllStations());
    }

    @PutMapping("/stations/{id}")
    public ResponseEntity<Station> updateStation(@PathVariable Long id, @RequestBody UpdateStationRequest request) {
        return ResponseEntity.ok(stationService.updateStation(id, request));
    }

    @DeleteMapping("/stations/{id}")
    public ResponseEntity<Map<String, String>> deleteStation(@PathVariable Long id) {
        try {
            stationService.deleteStation(id);
            return ResponseEntity.ok(Map.of("message", "Cửa hàng đã được xóa thành công!"));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        }
    }

    @PostMapping("/models")
    public ResponseEntity<Model> createModel(
            @ModelAttribute CreateModelRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        return ResponseEntity.ok(modelService.createModel(request, images));
    }

    @PutMapping("/models/{id}")
    public ResponseEntity<?> updateModel(
            @PathVariable Long id,
            @ModelAttribute UpdateModelRequest request,
            @RequestPart(value = "newImages", required = false) List<MultipartFile> newImages) {
        try {
            Model updated = modelService.updateModel(id, request, newImages);
            return ResponseEntity.ok(Map.of("message", "Cập nhật model thành công!", "model", updated));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/models/{id}")
    public ResponseEntity<?> getModelDetailsById(@PathVariable Long id) {
        return ResponseEntity.ok(modelService.getModelDetailsById(id));
    }

    @DeleteMapping("/models/{id}")
    public ResponseEntity<?> deleteModel(@PathVariable Long id) {
        try {
            modelService.deleteModel(id);
            return ResponseEntity.ok(Map.of("message", "Model đã được xóa thành công!"));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        }
    }
}