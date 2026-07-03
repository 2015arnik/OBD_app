package com.obd.service;

import com.obd.model.Fundraiser;
import com.obd.model.FundraiserStatus;
import com.obd.model.Gift;
import com.obd.model.Group;
import com.obd.model.GroupMembership;
import com.obd.model.Notification;
import com.obd.model.Subscription;
import com.obd.model.SubscriptionTargetType;
import com.obd.model.User;
import com.obd.repository.FundraiserRepository;
import com.obd.repository.GiftRepository;
import com.obd.repository.GroupMembershipRepository;
import com.obd.repository.GroupRepository;
import com.obd.repository.NotificationRepository;
import com.obd.repository.SubscriptionRepository;
import com.obd.repository.UserRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ReminderService {

    private final UserRepository users;
    private final SubscriptionRepository subscriptions;
    private final GroupMembershipRepository groupMemberships;
    private final GroupRepository groups;
    private final NotificationRepository notifications;
    private final GiftRepository gifts;
    private final FundraiserRepository fundraisers;
    private final int reminderDaysBefore;
    private final int fundraiserDaysBefore;

    public ReminderService(UserRepository users, SubscriptionRepository subscriptions,
                           GroupMembershipRepository groupMemberships,
                           GroupRepository groups,
                           NotificationRepository notifications,
                           GiftRepository gifts, FundraiserRepository fundraisers,
                           @Value("${app.reminder.days-before}") int reminderDaysBefore,
                           @Value("${app.fundraiser.days-before}") int fundraiserDaysBefore) {
        this.users = users;
        this.subscriptions = subscriptions;
        this.groupMemberships = groupMemberships;
        this.groups = groups;
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
                Set<Long> friendSubscriberIds = friendSubscriberIdsFor(birthdayUser);
                for (Long subscriberId : friendSubscriberIds) {
                    maybeNotify(subscriberId, birthdayUser, reminderMessage(birthdayUser.getName(), days));
                }
                for (Map.Entry<Long, String> entry : groupSubscriberSourcesFor(birthdayUser).entrySet()) {
                    if (friendSubscriberIds.contains(entry.getKey())) {
                        continue;
                    }
                    maybeNotify(
                            entry.getKey(),
                            birthdayUser,
                            groupReminderMessage(birthdayUser.getName(), days, entry.getValue())
                    );
                }
            }
            if (days <= fundraiserDaysBefore) {
                ensureFundraiser(birthdayUser, today);
            }
        }
    }

    public void notifyForNewSubscription(Long subscriberId, SubscriptionTargetType type, Long targetId) {
        if (type == SubscriptionTargetType.USER) {
            LocalDate today = LocalDate.now();
            users.findById(targetId).ifPresent(u -> tryNotify(subscriberId, u, today, null));
            return;
        }

        LocalDate today = LocalDate.now();
        if (type == SubscriptionTargetType.GROUP) {
            String groupName = groups.findById(targetId)
                    .map(Group::getName)
                    .orElse("Безымянная группа");
            for (GroupMembership membership : groupMemberships.findByGroupId(targetId)) {
                if (membership.getUserId().equals(subscriberId)) {
                    continue;
                }
                if (hasDirectUserSubscription(subscriberId, membership.getUserId())) {
                    continue;
                }
                users.findById(membership.getUserId())
                        .ifPresent(u -> tryNotify(subscriberId, u, today, groupName));
            }
        }
    }

    private void tryNotify(Long subscriberId, User birthdayUser, LocalDate today, String groupName) {
        Integer days = UserService.daysUntilBirthday(birthdayUser.getBirthDate(), today);
        if (days == null || days > reminderDaysBefore) {
            return;
        }
        String message = groupName == null
                ? reminderMessage(birthdayUser.getName(), days)
                : groupReminderMessage(birthdayUser.getName(), days, groupName);
        maybeNotify(subscriberId, birthdayUser, message);
    }

    private Set<Long> friendSubscriberIdsFor(User birthdayUser) {
        Set<Long> result = new HashSet<>();
        for (Subscription s : subscriptions.findByTargetTypeAndTargetId(SubscriptionTargetType.USER, birthdayUser.getId())) {
            result.add(s.getSubscriberId());
        }
        result.remove(birthdayUser.getId());
        return result;
    }

    private Map<Long, String> groupSubscriberSourcesFor(User birthdayUser) {
        Map<Long, String> result = new HashMap<>();
        for (GroupMembership membership : groupMemberships.findByUserId(birthdayUser.getId())) {
            String groupName = groups.findById(membership.getGroupId())
                    .map(Group::getName)
                    .orElse("Безымянная группа");
            for (Subscription s : subscriptions.findByTargetTypeAndTargetId(SubscriptionTargetType.GROUP, membership.getGroupId())) {
                if (s.getSubscriberId().equals(birthdayUser.getId())) {
                    continue;
                }
                result.putIfAbsent(s.getSubscriberId(), groupName);
            }
        }
        return result;
    }

    private void maybeNotify(Long subscriberId, User birthdayUser, String message) {
        if (subscriberId.equals(birthdayUser.getId())) {
            return;
        }
        if (hasUnreadNotificationForBirthday(subscriberId, birthdayUser.getId())) {
            return;
        }
        Notification n = new Notification();
        n.setUserId(subscriberId);
        n.setMessage(message);
        n.setLink("/friends/" + birthdayUser.getId());
        notifications.save(n);
    }

    private boolean hasUnreadNotificationForBirthday(Long userId, Long birthdayUserId) {
        String link = "/friends/" + birthdayUserId;
        for (Notification n : notifications.findByUserIdOrderByCreatedAtDesc(userId)) {
            if (!n.isRead() && link.equals(n.getLink())) {
                return true;
            }
        }
        return false;
    }

    private boolean hasDirectUserSubscription(Long subscriberId, Long targetUserId) {
        return subscriptions.existsBySubscriberIdAndTargetTypeAndTargetId(
                subscriberId,
                SubscriptionTargetType.USER,
                targetUserId
        );
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

    private String groupReminderMessage(String name, int days, String groupName) {
        if (days == 0) {
            return "Сегодня день рождения у " + name + " (группа \"" + groupName + "\")!";
        }
        if (days == 1) {
            return "Завтра день рождения у " + name + " (группа \"" + groupName + "\").";
        }
        return "Через " + days + " дн. день рождения у " + name + " (группа \"" + groupName + "\").";
    }
}
