package com.obd.dto;

import java.time.LocalDate;

public class UserBrief {
    public Long id;
    public String name;
    public LocalDate birthDate;
    public Integer daysUntilBirthday;

    public UserBrief(Long id, String name, LocalDate birthDate, Integer daysUntilBirthday) {
        this.id = id;
        this.name = name;
        this.birthDate = birthDate;
        this.daysUntilBirthday = daysUntilBirthday;
    }
}
