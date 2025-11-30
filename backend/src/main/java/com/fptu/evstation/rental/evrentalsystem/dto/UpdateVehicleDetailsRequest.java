package com.fptu.evstation.rental.evrentalsystem.dto;

import com.fptu.evstation.rental.evrentalsystem.entity.VehicleCondition;
import com.fptu.evstation.rental.evrentalsystem.entity.VehicleStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVehicleDetailsRequest {
    private String licensePlate;
    private Long modelId;
    private Long stationId;
    private Double currentMileage;
    @Min(value = 0, message = "Mức pin không thể âm")
    @Max(value = 100, message = "Mức pin không thể lớn hơn 100")
    private Integer batteryLevel;
    private VehicleCondition newCondition;
    private VehicleStatus status;
    private Double depositAmount;

    @Size(min = 17, max = 17, message = "Số khung (VIN) phải có đúng 17 ký tự.")
    @Pattern(
            regexp = "^[A-HJ-NPR-Z0-9]{17}$",
            message = "Số khung (VIN) không hợp lệ. Chỉ chứa chữ in HOA (A-Z, trừ I,O,Q) và số (0-9). VD: LYVTB3AA1P0000123"
    )
    private String vinNumber;

    @Size(min = 6, max = 30, message = "Số máy phải từ 6-30 ký tự.")
    @Pattern(
            regexp = "^[A-Z0-9\\-]+$",
            message = "Số máy không hợp lệ. Chỉ chứa chữ in HOA (A-Z), số (0-9) và dấu gạch ngang (-). VD: VF3-M-2024-000123"
    )
    private String engineNumber;

    private Integer manufacturingYear;
}
