package com.obd.web;

import com.obd.dto.UpdateProfileRequest;
import com.obd.dto.UserBrief;
import com.obd.dto.UserCard;
import com.obd.model.User;
import com.obd.repository.UserRepository;
import com.obd.security.CurrentUser;
import com.obd.service.UserService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final UserRepository users;

    public UserController(UserService userService, UserRepository users) {
        this.userService = userService;
        this.users = users;
    }

    @GetMapping
    public List<UserBrief> all() {
        return userService.listSortedByBirthday();
    }

    @GetMapping("/{id}")
    public UserCard one(@PathVariable Long id) {
        return userService.getCard(id);
    }

    @PatchMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody UpdateProfileRequest req, @CurrentUser User me) {
        if (!me.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can edit only your own profile");
        }
        if (req.name != null) {
            me.setName(req.name);
        }
        if (req.birthDate != null) {
            me.setBirthDate(req.birthDate);
        }
        return users.save(me);
    }
}
