package com.obd.model;

import jakarta.persistence.*;

/**
 * Links a user to a group (many-to-many, kept as an explicit table on purpose:
 * it is easier to read and to explain than JPA relationship "magic").
 */
@Entity
@Table(name = "group_memberships",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "group_id"}))
public class GroupMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long groupId;

    public GroupMembership() {
    }

    public GroupMembership(Long userId, Long groupId) {
        this.userId = userId;
        this.groupId = groupId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getGroupId() { return groupId; }
    public void setGroupId(Long groupId) { this.groupId = groupId; }
}
