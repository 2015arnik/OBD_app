package com.obd.web;

import com.obd.dto.AdminUpdateUserRequest;
import com.obd.dto.ImportUserRequest;
import com.obd.model.Group;
import com.obd.model.User;
import com.obd.repository.FundraiserRepository;
import com.obd.repository.GiftRepository;
import com.obd.repository.GroupMembershipRepository;
import com.obd.repository.GroupRepository;
import com.obd.repository.NotificationRepository;
import com.obd.repository.SubscriptionRepository;
import com.obd.repository.UserRepository;
import com.obd.security.CurrentUser;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserRepository users;
    private final GroupRepository groups;
    private final GroupMembershipRepository memberships;
    private final GiftRepository gifts;
    private final SubscriptionRepository subscriptions;
    private final NotificationRepository notifications;
    private final FundraiserRepository fundraisers;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository users, GroupRepository groups, GroupMembershipRepository memberships,
                           GiftRepository gifts, SubscriptionRepository subscriptions,
                           NotificationRepository notifications, FundraiserRepository fundraisers,
                           PasswordEncoder passwordEncoder) {
        this.users = users;
        this.groups = groups;
        this.memberships = memberships;
        this.gifts = gifts;
        this.subscriptions = subscriptions;
        this.notifications = notifications;
        this.fundraisers = fundraisers;
        this.passwordEncoder = passwordEncoder;
    }

    private void requireAdmin(User me) {
        if (!me.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access only");
        }
    }

    @GetMapping("/stats")
    public Map<String, Long> stats(@CurrentUser User me) {
        requireAdmin(me);
        return Map.of(
                "users", users.count(),
                "groups", groups.count(),
                "gifts", gifts.count(),
                "fundraisers", fundraisers.count());
    }

    @GetMapping("/users")
    public List<User> allUsers(@CurrentUser User me) {
        requireAdmin(me);
        return users.findAll();
    }

    @PatchMapping("/users/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody AdminUpdateUserRequest req, @CurrentUser User me) {
        requireAdmin(me);
        User u = users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (req.name != null) {
            u.setName(req.name);
        }
        if (req.birthDate != null) {
            u.setBirthDate(req.birthDate);
        }
        if (req.admin != null) {
            u.setAdmin(req.admin);
        }
        return users.save(u);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id, @CurrentUser User me) {
        requireAdmin(me);
        if (!users.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        gifts.findByOwnerId(id).forEach(g -> gifts.deleteById(g.getId()));
        memberships.findByUserId(id).forEach(m -> memberships.deleteById(m.getId()));
        subscriptions.findBySubscriberId(id).forEach(s -> subscriptions.deleteById(s.getId()));
        notifications.findByUserIdOrderByCreatedAtDesc(id).forEach(n -> notifications.deleteById(n.getId()));
        users.deleteById(id);
    }

    @GetMapping("/groups")
    public List<Group> allGroups(@CurrentUser User me) {
        requireAdmin(me);
        return groups.findAll();
    }

    @DeleteMapping("/groups/{id}")
    public void deleteGroup(@PathVariable Long id, @CurrentUser User me) {
        requireAdmin(me);
        if (!groups.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }
        memberships.findByGroupId(id).forEach(m -> memberships.deleteById(m.getId()));
        groups.deleteById(id);
    }

    @PostMapping("/import")
    public Map<String, Integer> importUsers(@RequestBody List<ImportUserRequest> items, @CurrentUser User me) {
        requireAdmin(me);
        int created = 0;
        int skipped = 0;
        for (ImportUserRequest item : items) {
            if (item.email == null || users.existsByEmail(item.email)) {
                skipped++;
                continue;
            }
            User u = new User();
            u.setName(item.name);
            u.setEmail(item.email);
            u.setBirthDate(item.birthDate);
            u.setPasswordHash(passwordEncoder.encode(item.password != null ? item.password : "password"));
            u.setAdmin(false);
            users.save(u);
            created++;
        }
        return Map.of("created", created, "skipped", skipped);
    }
}
