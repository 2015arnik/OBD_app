package com.obd.service;

import com.obd.model.Fundraiser;
import com.obd.model.FundraiserStatus;
import com.obd.model.Gift;
import com.obd.model.GroupMembership;
import com.obd.model.Notification;
import com.obd.model.Subscription;
import com.obd.model.SubscriptionTargetType;
import com.obd.model.User;
import com.obd.repository.FundraiserRepository;
import com.obd.repository.GiftRepository;
import com.obd.repository.GroupMembershipRepository;
import com.obd.repository.NotificationRepository;
import com.obd.repository.SubscriptionRepository;
import com.obd.repository.UserRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ReminderService {

    private final UserRepository users;
    private final SubscriptionRepository subscriptions;
    private final GroupMembershipRepository memberships;
    private final NotificationRepository notifications;
    private final GiftRepository gifts;
    private final FundraiserRepository fundraisers;
    private final int reminderDaysBefore;
    private final int fundraiserDaysBefore;

    public ReminderService(UserRepository users, SubscriptionRepository subscriptions,
                           GroupMembershipRepository memberships, NotificationRepository notifications,
                           GiftRepository gifts, FundraiserRepository fundraisers,
                           @Value("${app.reminder.days-before}") int reminderDaysBefore,
                           @Value("${app.fundraiser.days-before}") int fundraiserDaysBefore) {
        this.users = users;
        this.subscriptions = subscriptions;
        this.memberships = memberships;
        this.notifications = notifications;
        this.gifts = gifts;
        this.fundraisers = fundraisers;
        this.reminderDaysBefore = reminderDaysBefore;
        this.fundraiserDaysBefore = fundraiserDaysBefore;
    }

    public void run() {
        LocalDate today = LocalDate.now();
        for (User birthdayUser : users.findAll()) {
            Integer days = UserService.daysUntilBirthday(birthdayUser.getBirthDate(), today);
            if (days == null) {
                continue;
            }
            if (days <= reminderDaysBefore) {
                for (Long subscriberId : subscriberIdsFor(birthdayUser)) {
                    maybeNotify(subscriberId, birthdayUser, days);
                }
            }
            if (days <= fundraiserDaysBefore) {
                ensureFundraiser(birthdayUser, today);
            }
        }
    }

    public void notifyForNewSubscription(Long subscriberId, SubscriptionTargetType type, Long targetId) {
        LocalDate today = LocalDate.now();
        if (type == SubscriptionTargetType.USER) {
            users.findById(targetId).ifPresent(u -> tryNotify(subscriberId, u, today));
        } else {
            for (GroupMembership m : memberships.findByGroupId(targetId)) {
                users.findById(m.getUserId()).ifPresent(u -> tryNotify(subscriberId, u, today));
            }
        }
    }

    private void tryNotify(Long subscriberId, User birthdayUser, LocalDate today) {
        Integer days = UserService.daysUntilBirthday(birthdayUser.getBirthDate(), today);
        if (days == null || days > reminderDaysBefore) {
            return;
        }
        maybeNotify(subscriberId, birthdayUser, days);
    }

    private Set<Long> subscriberIdsFor(User birthdayUser) {
        Set<Long> result = new HashSet<>();
        for (Subscription s : subscriptions.findByTargetTypeAndTargetId(SubscriptionTargetType.USER, birthdayUser.getId())) {
            result.add(s.getSubscriberId());
        }
        for (GroupMembership m : memberships.findByUserId(birthdayUser.getId())) {
            for (Subscription s : subscriptions.findByTargetTypeAndTargetId(SubscriptionTargetType.GROUP, m.getGroupId())) {
                result.add(s.getSubscriberId());
            }
        }
        result.remove(birthdayUser.getId());
        return result;
    }

    private void maybeNotify(Long subscriberId, User birthdayUser, int days) {
        if (subscriberId.equals(birthdayUser.getId())) {
            return;
        }
        String message = reminderMessage(birthdayUser.getName(), days);
        if (hasUnreadNotification(subscriberId, message)) {
            return;
        }
        Notification n = new Notification();
        n.setUserId(subscriberId);
        n.setMessage(message);
        n.setLink("/friends/" + birthdayUser.getId());
        notifications.save(n);
    }

    private boolean hasUnreadNotification(Long userId, String message) {
        for (Notification n : notifications.findByUserIdOrderByCreatedAtDesc(userId)) {
            if (!n.isRead() && message.equals(n.getMessage())) {
                return true;
            }
        }
        return false;
    }

    private void ensureFundraiser(User birthdayUser, LocalDate today) {
        if (fundraisers.existsByTargetUserIdAndStatus(birthdayUser.getId(), FundraiserStatus.OPEN)) {
            return;
        }
        List<Gift> wishlist = gifts.findByOwnerId(birthdayUser.getId());
        if (wishlist.isEmpty()) {
            return;
        }
        Gift target = wishlist.stream()
                .filter(g -> g.getPrice() != null)
                .max(Comparator.comparing(Gift::getPrice))
                .orElse(wishlist.get(0));
        Integer goal = target.getPrice() != null ? target.getPrice() : 0;

        Fundraiser f = new Fundraiser();
        f.setTargetUserId(birthdayUser.getId());
        f.setGiftId(target.getId());
        f.setTitle("Сбор на подарок для " + birthdayUser.getName());
        f.setGoalAmount(goal);
        f.setCollectedAmount(0);
        f.setStatus(FundraiserStatus.OPEN);
        f.setDeadline(today.plusDays(daysUntil(birthdayUser, today)));
        fundraisers.save(f);

        String message = "Открыт сбор на подарок для " + birthdayUser.getName() + ".";
        for (Long subscriberId : subscriberIdsFor(birthdayUser)) {
            if (!hasUnreadNotification(subscriberId, message)) {
                Notification n = new Notification();
                n.setUserId(subscriberId);
                n.setMessage(message);
                n.setLink("/friends/" + birthdayUser.getId());
                notifications.save(n);
            }
        }
    }

    private int daysUntil(User u, LocalDate today) {
        Integer d = UserService.daysUntilBirthday(u.getBirthDate(), today);
        return d == null ? 0 : d;
    }

    private String reminderMessage(String name, int days) {
        if (days == 0) {
            return "Сегодня день рождения у " + name + "!";
        }
        if (days == 1) {
            return "Завтра день рождения у " + name + ".";
        }
        return "Через " + days + " дн. день рождения у " + name + ".";
    }
}
