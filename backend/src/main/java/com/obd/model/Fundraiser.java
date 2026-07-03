package com.obd.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A money collection for a friend's gift (via the mock bank). */
@Entity
@Table(name = "fundraisers")
@Getter @Setter @NoArgsConstructor
public class Fundraiser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long targetUserId;
    private Long giftId;
    private String title;

    private Integer goalAmount;
    private Integer collectedAmount = 0;

    @Enumerated(EnumType.STRING)
    private FundraiserStatus status = FundraiserStatus.OPEN;

    private LocalDate deadline;
}
