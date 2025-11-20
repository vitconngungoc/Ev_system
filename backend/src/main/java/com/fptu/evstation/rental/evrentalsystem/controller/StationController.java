package com.fptu.evstation.rental.evrentalsystem.controller;

import com.fptu.evstation.rental.evrentalsystem.entity.*;
import com.fptu.evstation.rental.evrentalsystem.service.AuthService;
import com.fptu.evstation.rental.evrentalsystem.service.RatingService;
import com.fptu.evstation.rental.evrentalsystem.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stations")
@RequiredArgsConstructor
public class StationController {
    private final StationService stationService;
    private final RatingService ratingService;
    private final AuthService authService;

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
    @PostMapping("/rating")
    public ResponseEntity<?> addRating(@RequestHeader("Authorization") String authHeader,
                                       @RequestBody Map<String, Object> request) {
        User user = authService.validateTokenAndGetUser(authService.getTokenFromHeader(authHeader));

        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản bị khóa không thể đánh giá.");
        }

        Long stationId = ((Number) request.get("stationId")).longValue();
        int stars = (int) request.get("stars");
        String comment = (String) request.get("comment");

        Rating saved = ratingService.saveRating(stationId, stars, comment, user);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/rating/{stationId}")
    public ResponseEntity<List<Rating>> getRatingsByStation(@PathVariable Long stationId) {
        return ResponseEntity.ok(ratingService.getRatingsByStation(stationId));
    }

    @GetMapping("/rating/{stationId}/average")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long stationId) {
        Double average = ratingService.getAverageRating(stationId);
        return ResponseEntity.ok(average);
    }
}
