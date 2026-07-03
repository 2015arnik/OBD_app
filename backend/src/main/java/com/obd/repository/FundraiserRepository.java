package com.obd.repository;

import com.obd.model.Fundraiser;
import com.obd.model.FundraiserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FundraiserRepository extends JpaRepository<Fundraiser, Long> {
    List<Fundraiser> findByTargetUserId(Long targetUserId);
    List<Fundraiser> findByStatus(FundraiserStatus status);
    boolean existsByTargetUserIdAndStatus(Long targetUserId, FundraiserStatus status);
}
