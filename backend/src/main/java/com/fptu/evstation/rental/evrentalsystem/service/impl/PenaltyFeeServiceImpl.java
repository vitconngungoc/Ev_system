package com.fptu.evstation.rental.evrentalsystem.service.impl;

import com.fptu.evstation.rental.evrentalsystem.entity.PenaltyFee;
import com.fptu.evstation.rental.evrentalsystem.repository.BookingRepository;
import com.fptu.evstation.rental.evrentalsystem.repository.PenaltyFeeRepository;
import com.fptu.evstation.rental.evrentalsystem.service.PaymentService;
import com.fptu.evstation.rental.evrentalsystem.service.PenaltyFeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PenaltyFeeServiceImpl implements PenaltyFeeService {
    private final PenaltyFeeRepository penaltyFeeRepository;

    @Override
    public List<PenaltyFee> getAllPenaltyFees() {
        return penaltyFeeRepository.findAll().stream()
                .filter(fee -> fee.getIsAdjustment() == null || !fee.getIsAdjustment())
                .toList();
    }
}
