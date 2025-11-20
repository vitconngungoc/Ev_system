package com.fptu.evstation.rental.evrentalsystem.dto;

import com.fptu.evstation.rental.evrentalsystem.entity.AccountStatus;
import com.fptu.evstation.rental.evrentalsystem.entity.Role;
import com.fptu.evstation.rental.evrentalsystem.entity.Station;
import com.fptu.evstation.rental.evrentalsystem.entity.VerificationStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private String fullName;
    private String email;
    private String phone;

    private String cccd;
    private String gplx;

    private String cccdPath1;
    private String cccdPath2;
    private String gplxPath1;
    private String gplxPath2;
    private String selfiePath;

    private VerificationStatus verificationStatus;
    private String rejectionReason;
    private AccountStatus status;
    private Integer cancellationCount;
    private Long userId;
    private String roleName;
    private String stationName;
    private Role role;
    private Station station;
}