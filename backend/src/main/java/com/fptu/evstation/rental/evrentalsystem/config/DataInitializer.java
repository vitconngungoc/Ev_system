package com.fptu.evstation.rental.evrentalsystem.config;

import com.fptu.evstation.rental.evrentalsystem.entity.Role;
import com.fptu.evstation.rental.evrentalsystem.entity.Station;
import com.fptu.evstation.rental.evrentalsystem.repository.RoleRepository;
import com.fptu.evstation.rental.evrentalsystem.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final RoleRepository roleRepository;
    private final StationRepository stationRepository;

    @Override
    public void run(String... args) throws Exception {
        List<String> roles = List.of("EV_RENTER", "STATION_STAFF", "ADMIN");
        for (String r : roles) {
            if (!roleRepository.existsByRoleName(r)) {
                roleRepository.save(Role.builder().roleName(r).build());
            }
        }
    }

    @Bean
    CommandLineRunner initStations() {
        return args -> {
            record StationData(String name, String address, String description, Double latitude, Double longitude, String openingHours, String hotline, String status) {}

            List<StationData> stationsToCreate = List.of(
                    new StationData("Trạm Evolve - Quận 1", "Số 2 Lê Lợi...", "...", 10.774034, 106.698958, "07:00 - 22:00", "1900123456", "ACTIVE"),
                    new StationData("Trạm Evolve - Quận 3", "Số 135 Điện Biên Phủ...", "...", 10.778912, 106.693421, "07:00 - 22:00", "1900123457", "ACTIVE"),
                    new StationData("Trạm Evolve - Bình Thạnh", "Số 88 Nguyễn Hữu Cảnh...", "...", 10.792546, 106.708005, "07:00 - 22:00", "1900123458", "ACTIVE")
            );

            for (StationData data : stationsToCreate) {
                if (!stationRepository.existsByName(data.name())) {
                    Station station = Station.builder()
                            .name(data.name())
                            .address(data.address())
                            .build();
                    stationRepository.save(station);
                }
            }
        };
    }
}
