package com.obd.service;

import com.obd.dto.ChargeResult;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MockBankService {

    public ChargeResult charge(Integer amount) {
        if (amount == null || amount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be positive");
        }
        String txnId = "MOCK-" + UUID.randomUUID();
        return new ChargeResult(txnId, "SUCCESS", amount);
    }
}
