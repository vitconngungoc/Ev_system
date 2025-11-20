package com.fptu.evstation.rental.evrentalsystem.service.impl;

import com.fptu.evstation.rental.evrentalsystem.dto.StationRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateStationRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.Station;
import com.fptu.evstation.rental.evrentalsystem.entity.StationStatus;
import com.fptu.evstation.rental.evrentalsystem.repository.StationRepository;
import com.fptu.evstation.rental.evrentalsystem.repository.VehicleRepository;
import com.fptu.evstation.rental.evrentalsystem.service.StationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StationServiceImpl implements StationService {
    private final StationRepository stationRepository;
    private final VehicleRepository vehicleRepository; // 

    @Override
    @Transactional
    public Station addStation(StationRequest request) {
        Station station = Station.builder()
                .name(request.getName())
                .address(request.getAddress())
                .openingHours(request.getOpeningHours())
                .description(request.getDescription())
                .hotline(request.getHotline())
                .status(StationStatus.ACTIVE)
                .latitude(0.0)
                .longitude(0.0)
                .build();
        return stationRepository.save(station);
    }

    @Override
    public List<Station> getAllStations() {
        return stationRepository.findAll();
    }

    @Override
    public Station updateStation(Long id, UpdateStationRequest request) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Station not found"));

        if (request.getName() != null) station.setName(request.getName());
        if (request.getAddress() != null) station.setAddress(request.getAddress());
        if (request.getOpeningHours() != null) station.setOpeningHours(request.getOpeningHours());
        if (request.getDescription() != null) station.setDescription(request.getDescription());
        if (request.getHotline() != null) station.setHotline(request.getHotline());

        if (request.getStatus() != null) {
            try {
                StationStatus newStatus = StationStatus.valueOf(request.getStatus().toUpperCase());
                station.setStatus(newStatus);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Trạng thái không hợp lệ. Chỉ có ACTIVE, INACTIVE, MAINTENANCE được cho phép.");
            }
        }

        return stationRepository.save(station);
    }

    @Override
    @Transactional
    public void deleteStation(Long id) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy trạm với ID " + id));
        long vehicleCount = vehicleRepository.countByStation(station);
        if (vehicleCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể xóa trạm '" + station.getName() + "' vì vẫn còn " + vehicleCount + " xe đang thuộc trạm này."
            );
        }
        stationRepository.delete(station);
    }

    @Override
    public Station getStationById(Long stationId) {
        return stationRepository.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy trạm với ID: " + stationId));
    }
}