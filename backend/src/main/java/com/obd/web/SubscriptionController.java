package com.obd.web;

import com.obd.dto.CreateSubscriptionRequest;
import com.obd.model.Subscription;
import com.obd.model.SubscriptionTargetType;
import com.obd.model.User;
import com.obd.repository.GroupRepository;
import com.obd.repository.SubscriptionRepository;
import com.obd.repository.UserRepository;
import com.obd.security.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/subscriptions")
public class SubscriptionController {

    private final SubscriptionRepository subscriptions;
    private final UserRepository users;
    private final GroupRepository groups;

    public SubscriptionController(SubscriptionRepository subscriptions, UserRepository users, GroupRepository groups) {
        this.subscriptions = subscriptions;
        this.users = users;
        this.groups = groups;
    }

    /** My subscriptions. */
    @GetMapping
    public List<Subscription> mine(@CurrentUser User me) {
        return subscriptions.findBySubscriberId(me.getId());
    }

    /** Subscribe to a friend (USER) or a whole group (GROUP). Duplicate-safe. */
    @PostMapping
    public Subscription create(@Valid @RequestBody CreateSubscriptionRequest req, @CurrentUser User me) {
        if (req.targetType == SubscriptionTargetType.USER && !users.existsById(req.targetId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user not found");
        }
        if (req.targetType == SubscriptionTargetType.GROUP && !groups.existsById(req.targetId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Target group not found");
        }
        if (subscriptions.existsBySubscriberIdAndTargetTypeAndTargetId(me.getId(), req.targetType, req.targetId)) {
            return subscriptions.findBySubscriberId(me.getId()).stream()
                    .filter(s -> s.getTargetType() == req.targetType && s.getTargetId().equals(req.targetId))
                    .findFirst()
                    .orElseThrow();
        }
        Subscription s = new Subscription();
        s.setSubscriberId(me.getId());
        s.setTargetType(req.targetType);
        s.setTargetId(req.targetId);
        return subscriptions.save(s);
    }

    /** Unsubscribe. */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, @CurrentUser User me) {
        Subscription s = subscriptions.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found"));
        if (!s.getSubscriberId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your subscription");
        }
        subscriptions.deleteById(id);
    }
}
