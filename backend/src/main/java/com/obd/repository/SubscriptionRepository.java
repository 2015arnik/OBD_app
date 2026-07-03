package com.obd.repository;

import com.obd.model.Subscription;
import com.obd.model.SubscriptionTargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findBySubscriberId(Long subscriberId);
    List<Subscription> findByTargetTypeAndTargetId(SubscriptionTargetType targetType, Long targetId);
    boolean existsBySubscriberIdAndTargetTypeAndTargetId(
            Long subscriberId, SubscriptionTargetType targetType, Long targetId);
}
