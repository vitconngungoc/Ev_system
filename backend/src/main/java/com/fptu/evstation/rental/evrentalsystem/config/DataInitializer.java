package com.fptu.evstation.rental.evrentalsystem.config;

import com.fptu.evstation.rental.evrentalsystem.entity.Role;
import com.fptu.evstation.rental.evrentalsystem.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        List<String> roles = List.of("EV_RENTER", "STATION_STAFF", "ADMIN");
        for (String r : roles) {
            if (!roleRepository.existsByRoleName(r)) {
                roleRepository.save(Role.builder().roleName(r).build());
            }
        }
    }
}
