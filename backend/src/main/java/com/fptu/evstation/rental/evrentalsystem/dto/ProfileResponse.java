package com.fptu.evstation.rental.evrentalsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ProfileResponse {
    private String fullName;
    private String role;
}
