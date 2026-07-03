package com.obd.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A person in the system. Everyone is both an account holder AND a "friend"
 * that others can see, subscribe to and buy gifts for.
 */
@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    /** BCrypt hash of the password. @JsonIgnore = never send it to the client. */
    @JsonIgnore
    private String passwordHash;

    private LocalDate birthDate;

    /** Access to the admin panel. */
    private boolean admin = false;
}
