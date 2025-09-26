package com.fptu.evstation.rental.evrentalsystem.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.fptu.evstation.rental.evrentalsystem.repository.RoleRepository;
import com.fptu.evstation.rental.evrentalsystem.entity.Role;
import java.util.List;

import java.util.List;

@Configuration
public class AppConfig {
    // khởi tạo roles mặc định
    @Bean
    CommandLineRunner initRoles(RoleRepository roleRepo) {
        return args -> {
            List<String> roles = List.of("EV_RENTER", "STATION_STAFF", "ADMIN");
            for(String r : roles) {
                roleRepo.findByRoleName(r).orElseGet(() ->
                        roleRepo.save(Role.builder().roleName(r).build())
                );
            }
        };
    }
}
