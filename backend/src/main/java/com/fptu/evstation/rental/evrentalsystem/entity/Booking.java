package com.fptu.evstation.rental.evrentalsystem.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "Bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicleId", nullable = true)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stationId", nullable = false)
    private Station station;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    @Column(nullable = false, columnDefinition = "bit default 0")
    boolean reservationDepositPaid = false; // đã trả tiền cọc 500k hay chưa ?

    @Column(nullable = false, columnDefinition = "bit default 0")
    private boolean rentalDepositPaid = false;  // đã thanh toán cọc thuê xe

    @Column
    private Double refund;                  // số tiền trả cho khách = cọc thuê xe + 500k tiền cọc giữ xe

    @Column(columnDefinition = "nvarchar(500)")
    private String refundNote;

    @Column
    private Double rentalDeposit;           // tiền cọc thuê xe

    @Column
    private Double finalFee;                // tổng phí cuối cùng

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    @Column(length = 500)
    private String invoicePdfPath;

    @Column(columnDefinition = "TEXT")
    private String checkInPhotoPaths;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
