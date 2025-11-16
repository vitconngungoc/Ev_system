package com.fptu.evstation.rental.evrentalsystem.controller;

import com.fptu.evstation.rental.evrentalsystem.dto.*;
import com.fptu.evstation.rental.evrentalsystem.entity.Model;
import com.fptu.evstation.rental.evrentalsystem.entity.Station;
import com.fptu.evstation.rental.evrentalsystem.entity.Vehicle;
import com.fptu.evstation.rental.evrentalsystem.entity.VehicleType;
import com.fptu.evstation.rental.evrentalsystem.service.ModelService;
import com.fptu.evstation.rental.evrentalsystem.service.StationService;
import com.fptu.evstation.rental.evrentalsystem.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    private final VehicleService vehicleService;

    // --- 1. Quản lý Trạm (Stations) ---
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
            return ResponseEntity.ok(Map.of(
                    "message", "Cửa hàng với ID " + id + " đã được xóa thành công!"
            ));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    // --- 2. Quản lý Mẫu xe (Models) ---
    @GetMapping("/models")
    public ResponseEntity<List<ModelResponse>> getAllModels(
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(modelService.getAllModels(keyword));
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
            return ResponseEntity.ok(Map.of(
                    "message", " Cập nhật model thành công!",
                    "model", updated
            ));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/models/{id}")
    public ResponseEntity<?> getModelDetailsById(@PathVariable Long id) {
        try {
            ModelResponse response = modelService.getModelDetailsById(id);
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @DeleteMapping("/models/{id}")
    public ResponseEntity<?> deleteModel(@PathVariable Long id) {
        try {
            modelService.deleteModel(id);
            return ResponseEntity.ok(Map.of("message", " Model với ID " + id + " đã được xóa thành công!"));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // --- 3. Quản lý Xe (Vehicles) ---
    @PostMapping("/vehicles")
    public ResponseEntity<VehicleResponse> createVehicle(@RequestBody CreateVehicleRequest request) {
        return ResponseEntity.ok(vehicleService.createVehicle(request));
    }

    @GetMapping("/vehicles")
    public ResponseEntity<List<VehicleResponse>> getAllVehicles(
            @RequestParam(required = false) Long modelId,
            @RequestParam(required = false) Long stationId,
            @RequestParam(required = false) VehicleType vehicleType,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String order) {
        return ResponseEntity.ok(vehicleService.getAllVehicles(modelId, stationId, vehicleType, sortBy, order));
    }

    @GetMapping("/vehicles/{id}")
    public ResponseEntity<?> getVehicleDetailsById(@PathVariable Long id) {
        try {
            VehicleResponse response = vehicleService.getVehicleDetailsById(id);
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }
    @PutMapping("/vehicles/{id}")
    public ResponseEntity<?> updateVehicle(@PathVariable Long id, @RequestBody UpdateVehicleDetailsRequest  request) {
        try {
            Vehicle updated = vehicleService.updateVehicle(id, request);
            return ResponseEntity.ok(Map.of(
                    "message", "Xe đã được cập nhật thành công!",
                    "vehicleId", updated.getVehicleId()
            ));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id) {
        try {
            vehicleService.deleteVehicle(id);
            return ResponseEntity.ok(Map.of(
                    "message", "Xe với ID " + id + " đã được xóa thành công!"
            ));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }
}