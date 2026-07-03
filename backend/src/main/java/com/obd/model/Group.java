package com.obd.model;

import jakarta.persistence.*;

/**
 * A group of people, e.g. "972501 TSU" or "volleyball team".
 * Any user can create one. Membership is stored separately in GroupMembership.
 * Table is named "groups" because GROUP is a reserved SQL word.
 */
@Entity
@Table(name = "groups")
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    /** Id of the user who created the group. */
    private Long creatorId;

    public Group() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getCreatorId() { return creatorId; }
    public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }
}
