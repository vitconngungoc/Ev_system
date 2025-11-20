package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.dto.BillResponse;
import com.fptu.evstation.rental.evrentalsystem.dto.InvoiceSummaryResponse;
import com.fptu.evstation.rental.evrentalsystem.entity.User;

import java.util.List;

public interface InvoiceService {
    String generateAndSendInvoice(BillResponse billDetails);
    List<InvoiceSummaryResponse> getAllInvoicesByStation(User staff);
}
