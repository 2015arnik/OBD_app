package com.obd.web;

import com.obd.dto.CreateGroupRequest;
import com.obd.dto.UserBrief;
import com.obd.model.Group;
import com.obd.model.GroupMembership;
import com.obd.model.User;
import com.obd.repository.GroupMembershipRepository;
import com.obd.repository.GroupRepository;
import com.obd.repository.UserRepository;
import com.obd.security.CurrentUser;
import com.obd.service.UserService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/groups")
public class GroupController {

    private final GroupRepository groups;
    private final GroupMembershipRepository memberships;
    private final UserRepository users;

    public GroupController(GroupRepository groups, GroupMembershipRepository memberships, UserRepository users) {
        this.groups = groups;
        this.memberships = memberships;
        this.users = users;
    }

    /** All groups (visible to everyone). */
    @GetMapping
    public List<Group> all() {
        return groups.findAll();
    }

    /** Create a group. The creator automatically joins it. */
    @PostMapping
    public Group create(@Valid @RequestBody CreateGroupRequest req, @CurrentUser User me) {
        Group g = new Group();
        g.setName(req.name);
        g.setDescription(req.description);
        g.setCreatorId(me.getId());
        g = groups.save(g);
        if (!memberships.existsByUserIdAndGroupId(me.getId(), g.getId())) {
            memberships.save(new GroupMembership(me.getId(), g.getId()));
        }
        return g;
    }

    /** Join a group (idempotent). */
    @PostMapping("/{id}/join")
    public Group join(@PathVariable Long id, @CurrentUser User me) {
        Group g = groups.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));
        if (!memberships.existsByUserIdAndGroupId(me.getId(), id)) {
            memberships.save(new GroupMembership(me.getId(), id));
        }
        return g;
    }

    /** Members of a group. */
    @GetMapping("/{id}/members")
    public List<UserBrief> members(@PathVariable Long id) {
        List<UserBrief> result = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (GroupMembership m : memberships.findByGroupId(id)) {
            users.findById(m.getUserId()).ifPresent(u ->
                    result.add(new UserBrief(u.getId(), u.getName(), u.getBirthDate(),
                            UserService.daysUntilBirthday(u.getBirthDate(), today))));
        }
        return result;
    }
}
