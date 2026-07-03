package com.obd.web;

import com.obd.dto.ChargeRequest;
import com.obd.dto.ChargeResult;
import com.obd.service.MockBankService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/mock-bank")
public class MockBankController {

    private final MockBankService mockBankService;

    public MockBankController(MockBankService mockBankService) {
        this.mockBankService = mockBankService;
    }

    @PostMapping("/charge")
    public ChargeResult charge(@Valid @RequestBody ChargeRequest req) {
        return mockBankService.charge(req.amount);
    }
}
