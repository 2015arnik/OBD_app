package com.obd.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A group of people, e.g. "972501 TSU" or "volleyball team".
 * Any user can create one. Membership is stored separately in GroupMembership.
 * Table is named "groups" because GROUP is a reserved SQL word.
 */
@Entity
@Table(name = "groups")
@Getter @Setter @NoArgsConstructor
public class Group {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    /** Id of the user who created the group. */
    private Long creatorId;
}
