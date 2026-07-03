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
        User olga = user("Ольга Миронова", "olga@obd.app", bday(today, 12), false);
        User dima = user("Дмитрий Соколов", "dima@obd.app", bday(today, 18), false);
        User marina = user("Марина Белова", "marina@obd.app", bday(today, 24), false);
        User pavel = user("Павел Егоров", "pavel@obd.app", bday(today, 42), false);
        User lena = user("Елена Громова", "lena@obd.app", bday(today, 56), false);
        User artem = user("Артём Лебедев", "artem@obd.app", bday(today, 75), false);
        User admin = user("Администратор", "admin@obd.app", bday(today, 90), true);

        Group tsu = group("972501 ТГУ", "Учебная группа первого курса", anna.getId());
        Group volley = group("Сборная по волейболу", "Тренировки по вторникам и четвергам", boris.getId());
        Group office = group("Команда продукта", "Рабочая команда, которая готовит сюрпризы коллегам", olga.getId());
        Group board = group("Настолки по пятницам", "Друзья, которые любят настольные игры и совместные подарки", marina.getId());

        join(anna, tsu);
        join(boris, tsu);
        join(sveta, tsu);
        join(katya, tsu);
        join(dima, tsu);
        join(boris, volley);
        join(igor, volley);
        join(anna, volley);
        join(pavel, volley);
        join(olga, office);
        join(lena, office);
        join(admin, office);
        join(marina, board);
        join(artem, board);
        join(anna, board);

        gift(boris, "Механическая клавиатура", "Тактильная, коричневые свитчи", "https://example.com/keyboard", 7000);
        gift(boris, "Книга по алгоритмам", "CLRS на русском", "https://example.com/clrs", 3000);
        gift(anna, "Беспроводные наушники", "С активным шумоподавлением", "https://example.com/headphones", 12000);
        gift(sveta, "Набор для рисования", "Акварель и кисти", null, 2500);
        gift(igor, "Фитнес-браслет", "С трекингом сна и пульса", "https://example.com/band", 5500);
        gift(katya, "Сертификат в книжный", "Любит бумажные книги и красивую канцелярию", null, 4000);
        gift(olga, "Курс по керамике", "Серия творческих мастер-классов", "https://example.com/ceramics", 6500);
        gift(dima, "LEGO Technic", "Любая сложная инженерная модель", "https://example.com/lego", 9800);
        gift(marina, "Планшет для заметок", "Для работы и быстрых скетчей", "https://example.com/tablet", 11000);
        gift(pavel, "Футбольный мяч", "Профессиональный размер 5", null, 3500);
        gift(lena, "Кофемолка", "Компактная электрическая модель", "https://example.com/coffee", 7200);
        gift(artem, "Подписка на музыку", "Годовой премиум-тариф", null, 2500);

        gift(anna, "Плед крупной вязки", "Светлый и очень мягкий", null, 4500);
        gift(sveta, "Набор маркеров", "Для скетчинга и иллюстраций", "https://example.com/markers", 1800);
        gift(olga, "Парфюм", "Свежий цитрусовый аромат", null, 9000);
        gift(dima, "Игровая мышь", "Лёгкая, с хорошим сенсором", "https://example.com/mouse", 4300);
        gift(lena, "Тёплый халат", "Домашний и уютный", null, 5000);

        subscribe(anna, SubscriptionTargetType.USER, boris.getId());
        subscribe(anna, SubscriptionTargetType.USER, sveta.getId());
        subscribe(anna, SubscriptionTargetType.USER, olga.getId());
        subscribe(anna, SubscriptionTargetType.USER, marina.getId());
        subscribe(anna, SubscriptionTargetType.GROUP, volley.getId());
        subscribe(anna, SubscriptionTargetType.GROUP, board.getId());
        subscribe(igor, SubscriptionTargetType.USER, boris.getId());
        subscribe(olga, SubscriptionTargetType.USER, lena.getId());
        subscribe(marina, SubscriptionTargetType.USER, artem.getId());
        subscribe(dima, SubscriptionTargetType.GROUP, tsu.getId());

        notify(anna.getId(), "Через 7 дн. день рождения у Борис Ким.", "/friends/" + boris.getId());
        notify(olga.getId(), "Через 56 дн. день рождения у Елена Громова.", "/friends/" + lena.getId());
        notify(marina.getId(), "Через 75 дн. день рождения у Артём Лебедев.", "/friends/" + artem.getId());

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

        Fundraiser officeFundraiser = new Fundraiser();
        officeFundraiser.setTargetUserId(lena.getId());
        officeFundraiser.setTitle("Сбор на кофемолку для Лены");
        officeFundraiser.setGoalAmount(7200);
        officeFundraiser.setCollectedAmount(3000);
        officeFundraiser.setStatus(FundraiserStatus.OPEN);
        officeFundraiser.setDeadline(today.plusDays(10));
        officeFundraiser = fundraisers.save(officeFundraiser);

        contribution(officeFundraiser.getId(), olga.getId(), 2000);
        contribution(officeFundraiser.getId(), marina.getId(), 1000);
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
