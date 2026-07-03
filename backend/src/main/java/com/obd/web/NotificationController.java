package com.obd.web;

import com.obd.model.Notification;
import com.obd.model.User;
import com.obd.repository.NotificationRepository;
import com.obd.security.CurrentUser;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationRepository notifications;

    public NotificationController(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    /** My notifications, newest first. */
    @GetMapping
    public List<Notification> mine(@CurrentUser User me) {
        return notifications.findByUserIdOrderByCreatedAtDesc(me.getId());
    }

    /** Mark one of my notifications as read. */
    @PostMapping("/{id}/read")
    public Notification read(@PathVariable Long id, @CurrentUser User me) {
        Notification n = notifications.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.getUserId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your notification");
        }
        n.setRead(true);
        return notifications.save(n);
    }
}
