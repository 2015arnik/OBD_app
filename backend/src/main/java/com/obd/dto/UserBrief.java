package com.obd.dto;

import java.time.LocalDate;

/** Short view of a user for lists (people screen). */
public class UserBrief {
    public Long id;
    public String name;
    public LocalDate birthDate;
    public Integer daysUntilBirthday; // 0 = today, null = no birth date

    public UserBrief(Long id, String name, LocalDate birthDate, Integer daysUntilBirthday) {
        this.id = id;
        this.name = name;
        this.birthDate = birthDate;
        this.daysUntilBirthday = daysUntilBirthday;
    }
}
