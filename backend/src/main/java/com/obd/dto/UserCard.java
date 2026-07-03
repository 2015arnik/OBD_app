package com.obd.dto;

import com.obd.model.Gift;
import com.obd.model.Group;
import com.obd.model.User;
import java.time.LocalDate;
import java.util.List;

/** Full friend card: profile + groups + wishlist. */
public class UserCard {
    public Long id;
    public String name;
    public LocalDate birthDate;
    public Integer daysUntilBirthday;
    public boolean admin;
    public List<Group> groups;
    public List<Gift> gifts;

    public UserCard(User u, Integer daysUntilBirthday, List<Group> groups, List<Gift> gifts) {
        this.id = u.getId();
        this.name = u.getName();
        this.birthDate = u.getBirthDate();
        this.admin = u.isAdmin();
        this.daysUntilBirthday = daysUntilBirthday;
        this.groups = groups;
        this.gifts = gifts;
    }
}
