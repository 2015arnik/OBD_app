package com.obd.web;

import com.obd.dto.ChangePasswordRequest;
import com.obd.dto.UpdateProfileRequest;
import com.obd.dto.UserBrief;
import com.obd.dto.UserCard;
import com.obd.model.User;
import com.obd.repository.UserRepository;
import com.obd.security.CurrentUser;
import com.obd.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserService userService, UserRepository users, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
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

    @PatchMapping("/{id}/password")
    public Map<String, String> changePassword(@PathVariable Long id, @Valid @RequestBody ChangePasswordRequest req, @CurrentUser User me) {
        if (!me.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can edit only your own profile");
        }
        if (!passwordEncoder.matches(req.currentPassword, me.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Текущий пароль введён неверно");
        }
        if (req.newPassword.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Новый пароль должен быть не короче 6 символов");
        }
        me.setPasswordHash(passwordEncoder.encode(req.newPassword));
        users.save(me);
        return Map.of("message", "Пароль обновлён");
    }
}
