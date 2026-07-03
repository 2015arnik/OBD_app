package com.obd.repository;

import com.obd.model.Gift;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GiftRepository extends JpaRepository<Gift, Long> {
    List<Gift> findByOwnerId(Long ownerId);
}
