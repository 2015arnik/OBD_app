package com.obd.web;

import com.obd.dto.ContributeRequest;
import com.obd.dto.CreateFundraiserRequest;
import com.obd.model.Contribution;
import com.obd.model.Fundraiser;
import com.obd.model.User;
import com.obd.security.CurrentUser;
import com.obd.service.FundraiserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/fundraisers")
public class FundraiserController {

    private final FundraiserService fundraiserService;

    public FundraiserController(FundraiserService fundraiserService) {
        this.fundraiserService = fundraiserService;
    }

    @GetMapping
    public List<Fundraiser> all() {
        return fundraiserService.listAll();
    }

    @GetMapping("/{id}")
    public Fundraiser one(@PathVariable Long id) {
        return fundraiserService.get(id);
    }

    @PostMapping
    public Fundraiser create(@Valid @RequestBody CreateFundraiserRequest req, @CurrentUser User me) {
        return fundraiserService.create(req, me.getId());
    }

    @PostMapping("/{id}/contribute")
    public Fundraiser contribute(@PathVariable Long id, @Valid @RequestBody ContributeRequest req, @CurrentUser User me) {
        return fundraiserService.contribute(id, me.getId(), req.amount);
    }

    @GetMapping("/{id}/contributions")
    public List<Contribution> contributions(@PathVariable Long id) {
        return fundraiserService.listContributions(id);
    }
}
