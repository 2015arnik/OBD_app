package com.obd.config;

import com.obd.model.Contribution;
import com.obd.model.Fundraiser;
import com.obd.model.FundraiserStatus;
import com.obd.model.Gift;
import com.obd.model.Group;
import com.obd.model.GroupMembership;
import com.obd.model.Notification;
import com.obd.model.Subscription;
import com.obd.model.SubscriptionTargetType;
import com.obd.model.User;
import com.obd.repository.ContributionRepository;
import com.obd.repository.FundraiserRepository;
import com.obd.repository.GiftRepository;
import com.obd.repository.GroupMembershipRepository;
import com.obd.repository.GroupRepository;
import com.obd.repository.NotificationRepository;
import com.obd.repository.SubscriptionRepository;
import com.obd.repository.UserRepository;
import java.time.LocalDate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final GroupRepository groups;
    private final GroupMembershipRepository memberships;
    private final GiftRepository gifts;
    private final SubscriptionRepository subscriptions;
    private final NotificationRepository notifications;
    private final FundraiserRepository fundraisers;
    private final ContributionRepository contributions;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository users, GroupRepository groups, GroupMembershipRepository memberships,
                      GiftRepository gifts, SubscriptionRepository subscriptions, NotificationRepository notifications,
                      FundraiserRepository fundraisers, ContributionRepository contributions,
                      PasswordEncoder passwordEncoder) {
        this.users = users;
        this.groups = groups;
        this.memberships = memberships;
        this.gifts = gifts;
        this.subscriptions = subscriptions;
        this.notifications = notifications;
        this.fundraisers = fundraisers;
        this.contributions = contributions;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (users.count() > 0) {
            return;
        }
        LocalDate today = LocalDate.now();

        User anna = user("Анна Смирнова", "anna@obd.app", bday(today, 3), false);
        User boris = user("Борис Ким", "boris@obd.app", bday(today, 7), false);
        User sveta = user("Света Орлова", "sveta@obd.app", bday(today, 1), false);
        User igor = user("Игорь Волков", "igor@obd.app", bday(today, 30), false);
        User katya = user("Катя Новикова", "katya@obd.app", bday(today, 160), false);
        User admin = user("Администратор", "admin@obd.app", bday(today, 90), true);

        Group tsu = group("972501 ТГУ", "Учебная группа первого курса", anna.getId());
        Group volley = group("Сборная по волейболу", "Тренировки по вторникам и четвергам", boris.getId());

        join(anna, tsu);
        join(boris, tsu);
        join(sveta, tsu);
        join(boris, volley);
        join(igor, volley);
        join(anna, volley);

        gift(boris, "Механическая клавиатура", "Тактильная, коричневые свитчи", "https://example.com/keyboard", 7000);
        gift(boris, "Книга по алгоритмам", "CLRS на русском", "https://example.com/clrs", 3000);
        gift(anna, "Беспроводные наушники", "С активным шумоподавлением", "https://example.com/headphones", 12000);
        gift(sveta, "Набор для рисования", "Акварель и кисти", null, 2500);

        subscribe(anna, SubscriptionTargetType.USER, boris.getId());
        subscribe(anna, SubscriptionTargetType.GROUP, volley.getId());
        subscribe(igor, SubscriptionTargetType.USER, boris.getId());

        notify(anna.getId(), "Через 7 дн. день рождения у Борис Ким.", "/friends/" + boris.getId());
        notify(anna.getId(), "Скоро дни рождения в группе «Сборная по волейболу».", "/groups");

        Fundraiser f = new Fundraiser();
        f.setTargetUserId(boris.getId());
        f.setTitle("Сбор на подарок для Борис Ким");
        f.setGoalAmount(7000);
        f.setCollectedAmount(2500);
        f.setStatus(FundraiserStatus.OPEN);
        f.setDeadline(today.plusDays(7));
        f = fundraisers.save(f);

        contribution(f.getId(), anna.getId(), 1500);
        contribution(f.getId(), igor.getId(), 1000);
    }

    private LocalDate bday(LocalDate today, int daysAhead) {
        return today.plusDays(daysAhead).withYear(2000);
    }

    private User user(String name, String email, LocalDate birthDate, boolean admin) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode("password"));
        u.setBirthDate(birthDate);
        u.setAdmin(admin);
        return users.save(u);
    }

    private Group group(String name, String description, Long creatorId) {
        Group g = new Group();
        g.setName(name);
        g.setDescription(description);
        g.setCreatorId(creatorId);
        return groups.save(g);
    }

    private void join(User u, Group g) {
        memberships.save(new GroupMembership(u.getId(), g.getId()));
    }

    private void gift(User owner, String title, String description, String url, Integer price) {
        Gift gi = new Gift();
        gi.setOwnerId(owner.getId());
        gi.setTitle(title);
        gi.setDescription(description);
        gi.setUrl(url);
        gi.setPrice(price);
        gifts.save(gi);
    }

    private void subscribe(User subscriber, SubscriptionTargetType type, Long targetId) {
        Subscription s = new Subscription();
        s.setSubscriberId(subscriber.getId());
        s.setTargetType(type);
        s.setTargetId(targetId);
        subscriptions.save(s);
    }

    private void notify(Long userId, String message, String link) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setMessage(message);
        n.setLink(link);
        notifications.save(n);
    }

    private void contribution(Long fundraiserId, Long contributorId, Integer amount) {
        Contribution c = new Contribution();
        c.setFundraiserId(fundraiserId);
        c.setContributorId(contributorId);
        c.setAmount(amount);
        c.setMockTxnId("MOCK-SEED-" + fundraiserId + "-" + contributorId);
        contributions.save(c);
    }
}
