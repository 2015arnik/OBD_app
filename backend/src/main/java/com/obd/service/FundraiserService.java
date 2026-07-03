package com.obd.service;

import com.obd.dto.ChargeResult;
import com.obd.dto.CreateFundraiserRequest;
import com.obd.model.Contribution;
import com.obd.model.Fundraiser;
import com.obd.model.FundraiserStatus;
import com.obd.repository.ContributionRepository;
import com.obd.repository.FundraiserRepository;
import com.obd.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FundraiserService {

    private final FundraiserRepository fundraisers;
    private final ContributionRepository contributions;
    private final UserRepository users;
    private final MockBankService mockBank;

    public FundraiserService(FundraiserRepository fundraisers, ContributionRepository contributions,
                             UserRepository users, MockBankService mockBank) {
        this.fundraisers = fundraisers;
        this.contributions = contributions;
        this.users = users;
        this.mockBank = mockBank;
    }

    public List<Fundraiser> listAll() {
        return fundraisers.findAll();
    }

    public Fundraiser get(Long id) {
        return fundraisers.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fundraiser not found"));
    }

    public Fundraiser create(CreateFundraiserRequest req, Long creatorId) {
        if (req.targetUserId.equals(creatorId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot start a fundraiser for yourself");
        }
        if (!users.existsById(req.targetUserId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user not found");
        }
        List<Fundraiser> open = fundraisers.findByTargetUserId(req.targetUserId).stream()
                .filter(f -> f.getStatus() == FundraiserStatus.OPEN)
                .toList();
        if (!open.isEmpty()) {
            return open.get(0);
        }
        Fundraiser f = new Fundraiser();
        f.setTargetUserId(req.targetUserId);
        f.setGiftId(req.giftId);
        f.setTitle(req.title);
        f.setGoalAmount(req.goalAmount);
        f.setDeadline(req.deadline);
        return fundraisers.save(f);
    }

    public Fundraiser contribute(Long fundraiserId, Long contributorId, Integer amount) {
        Fundraiser f = get(fundraiserId);
        if (f.getStatus() != FundraiserStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Fundraiser is closed");
        }
        ChargeResult charge = mockBank.charge(amount);

        Contribution c = new Contribution();
        c.setFundraiserId(fundraiserId);
        c.setContributorId(contributorId);
        c.setAmount(amount);
        c.setMockTxnId(charge.txnId);
        contributions.save(c);

        f.setCollectedAmount(f.getCollectedAmount() + amount);
        if (f.getGoalAmount() != null && f.getCollectedAmount() >= f.getGoalAmount()) {
            f.setStatus(FundraiserStatus.CLOSED);
        }
        return fundraisers.save(f);
    }

    public List<Contribution> listContributions(Long fundraiserId) {
        return contributions.findByFundraiserId(fundraiserId);
    }
}
