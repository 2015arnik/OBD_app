package com.obd.repository;

import com.obd.model.GroupMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GroupMembershipRepository extends JpaRepository<GroupMembership, Long> {
    List<GroupMembership> findByUserId(Long userId);
    List<GroupMembership> findByGroupId(Long groupId);
    boolean existsByUserIdAndGroupId(Long userId, Long groupId);
}
