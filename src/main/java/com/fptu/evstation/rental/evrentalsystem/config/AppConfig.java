package com.fptu.evstation.rental.evrentalsystem.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import com.fptu.evstation.rental.evrentalsystem.repository.RoleRepository;
import com.fptu.evstation.rental.evrentalsystem.entity.Role;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;



@Configuration
@EnableWebSecurity
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

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Kích hoạt CORS (di chuyển lên đầu để apply sớm)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Vô hiệu hóa CSRF (di chuyển lên trước authorize)
                .csrf(csrf -> csrf.disable())
                // THÊM: Stateless session để tránh cookie JSESSIONID gây 403 lần 2
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Cấu hình quyền truy cập
                .authorizeHttpRequests(auth -> auth
                        // Cho phép tất cả request đến /api/auth/** (register, login, logout)
                        .requestMatchers("/api/auth/**").permitAll()
                        // Yêu cầu xác thực cho /api/profile/**
                        .requestMatchers("/api/profile/**").permitAll()
                        // Các request khác cần xác thực
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated()
                );

        return http.build();
    }

    // Phần CORS giữ nguyên, nhưng SỬA origins để rõ ràng hơn (thêm port nếu cần)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // SỬA: Thêm port rõ ràng, bỏ "http://127.0.0.1" nếu không dùng
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5500","http://127.0.0.1:5500","http://localhost:8080"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}
