package com.fptu.evstation.rental.evrentalsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVehicleRequest {
    private String licensePlate;
    private Integer batteryLevel;
    private Long modelId;
    private Long stationId;
    private Double currentMileage;
    private String status;
    private String condition;
    private Double depositAmount;

    @NotBlank(message = "Số khung (VIN) không được để trống")
    @Size(min = 17, max = 17, message = "Số khung (VIN) phải có đúng 17 ký tự.")
    @Pattern(
            regexp = "^[A-HJ-NPR-Z0-9]{17}$",
            message = "Số khung (VIN) không hợp lệ. Chỉ chứa chữ in HOA (A-Z, trừ I,O,Q) và số (0-9). VD: LYVTB3AA1P0000123"
    )
    private String vinNumber;

    @NotBlank(message = "Số máy không được để trống")
    @Size(min = 6, max = 30, message = "Số máy phải từ 6-30 ký tự.")
    @Pattern(
            regexp = "^[A-Z0-9\\-]+$",
            message = "Số máy không hợp lệ. Chỉ chứa chữ in HOA (A-Z), số (0-9) và dấu gạch ngang (-). VD: VF3-M-2024-000123"
    )
    private String engineNumber;

    @NotNull(message = "Năm sản xuất không được để trống")
    private Integer manufacturingYear;
}
