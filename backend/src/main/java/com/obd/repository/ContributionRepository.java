package com.obd.repository;

import com.obd.model.Contribution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContributionRepository extends JpaRepository<Contribution, Long> {
    List<Contribution> findByFundraiserId(Long fundraiserId);
}
