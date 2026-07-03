package com.obd.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One item in a user's wishlist. */
@Entity
@Table(name = "gifts")
@Getter @Setter @NoArgsConstructor
public class Gift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Whose wishlist this belongs to. */
    private Long ownerId;

    private String title;

    @Column(length = 1000)
    private String description;

    private String url;

    /** Price in whole currency units (e.g. rubles). Used by the fundraiser. */
    private Integer price;

    @Enumerated(EnumType.STRING)
    private GiftStatus status = GiftStatus.WANTED;
}
