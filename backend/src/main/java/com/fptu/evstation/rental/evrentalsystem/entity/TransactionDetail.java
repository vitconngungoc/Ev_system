package com.fptu.evstation.rental.evrentalsystem.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "TransactionDetails")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long detailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bookingId", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feeId", nullable = false)
    private PenaltyFee penaltyFee;

    @Column(nullable = false)
    private Double appliedAmount;

    @Column(columnDefinition = "nvarchar(500)")
    private String staffNote;

    @Column(columnDefinition = "nvarchar(500)")
    private String adjustmentNote;

    @Column(columnDefinition = "TEXT")
    private String photoPaths;
}