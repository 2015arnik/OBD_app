package com.obd.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Links a user to a group (many-to-many, kept as an explicit table on purpose:
 * it is easier to read and to explain than JPA relationship "magic").
 */
@Entity
@Table(name = "group_memberships",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "group_id"}))
@Getter @Setter @NoArgsConstructor
public class GroupMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long groupId;

    public GroupMembership(Long userId, Long groupId) {
        this.userId = userId;
        this.groupId = groupId;
    }
}
