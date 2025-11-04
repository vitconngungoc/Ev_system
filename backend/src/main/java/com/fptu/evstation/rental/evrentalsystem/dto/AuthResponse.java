package com.fptu.evstation.rental.evrentalsystem.dto;

import lombok.*;
import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private Instant expiresAt;
    private String fullName;
}
