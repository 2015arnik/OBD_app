package com.obd.service;

import com.obd.dto.UserBrief;
import com.obd.dto.UserCard;
import com.obd.model.Gift;
import com.obd.model.Group;
import com.obd.model.GroupMembership;
import com.obd.model.User;
import com.obd.repository.GiftRepository;
import com.obd.repository.GroupMembershipRepository;
import com.obd.repository.GroupRepository;
import com.obd.repository.UserRepository;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Business logic around users: birthday sorting and building the friend card. */
@Service
public class UserService {

    private final UserRepository users;
    private final GroupMembershipRepository memberships;
    private final GroupRepository groups;
    private final GiftRepository gifts;

    public UserService(UserRepository users, GroupMembershipRepository memberships,
                       GroupRepository groups, GiftRepository gifts) {
        this.users = users;
        this.memberships = memberships;
        this.groups = groups;
        this.gifts = gifts;
    }

    /** All users, sorted so the nearest upcoming birthday comes first. */
    public List<UserBrief> listSortedByBirthday() {
        LocalDate today = LocalDate.now();
        List<UserBrief> result = new ArrayList<>();
        for (User u : users.findAll()) {
            result.add(new UserBrief(u.getId(), u.getName(), u.getBirthDate(),
                    daysUntilBirthday(u.getBirthDate(), today)));
        }
        result.sort(Comparator.comparing(b -> b.daysUntilBirthday == null
                ? Integer.MAX_VALUE : b.daysUntilBirthday));
        return result;
    }

    /** Full friend card: profile + groups + wishlist. */
    public UserCard getCard(Long id) {
        User u = users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        List<Group> userGroups = new ArrayList<>();
        for (GroupMembership m : memberships.findByUserId(id)) {
            groups.findById(m.getGroupId()).ifPresent(userGroups::add);
        }
        List<Gift> wishlist = gifts.findByOwnerId(id);
        return new UserCard(u, daysUntilBirthday(u.getBirthDate(), LocalDate.now()), userGroups, wishlist);
    }

    /** Days from today until the next birthday (0 = today). Null if there is no birth date. */
    public static Integer daysUntilBirthday(LocalDate birthDate, LocalDate today) {
        if (birthDate == null) {
            return null;
        }
        MonthDay md = MonthDay.from(birthDate);
        LocalDate thisYear = md.atYear(today.getYear());       // Feb 29 -> Feb 28 in non-leap years
        LocalDate next = thisYear.isBefore(today) ? md.atYear(today.getYear() + 1) : thisYear;
        return (int) ChronoUnit.DAYS.between(today, next);
    }
}
