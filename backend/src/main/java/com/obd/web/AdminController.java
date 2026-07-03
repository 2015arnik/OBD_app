package com.obd.web;

import com.obd.dto.AdminChatRoomDto;
import com.obd.dto.AdminUpdateFundraiserRequest;
import com.obd.dto.AdminUpdateGroupRequest;
import com.obd.dto.AdminUpdateMessageRequest;
import com.obd.dto.AdminUpdateUserRequest;
import com.obd.dto.ChatMessageDto;
import com.obd.dto.ImportUserRequest;
import com.obd.dto.UpdateGiftRequest;
import com.obd.model.ChatMessage;
import com.obd.model.Contribution;
import com.obd.model.Fundraiser;
import com.obd.model.Group;
import com.obd.model.Gift;
import com.obd.model.SubscriptionTargetType;
import com.obd.model.User;
import com.obd.repository.ChatMessageRepository;
import com.obd.repository.ContributionRepository;
import com.obd.repository.FundraiserRepository;
import com.obd.repository.GiftRepository;
import com.obd.repository.GroupMembershipRepository;
import com.obd.repository.GroupRepository;
import com.obd.repository.NotificationRepository;
import com.obd.repository.SubscriptionRepository;
import com.obd.repository.UserRepository;
import com.obd.service.ChatService;
import com.obd.security.CurrentUser;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
    private final ContributionRepository contributions;
    private final ChatMessageRepository chatMessages;
    private final ChatService chatService;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository users, GroupRepository groups, GroupMembershipRepository memberships,
                           GiftRepository gifts, SubscriptionRepository subscriptions,
                           NotificationRepository notifications, FundraiserRepository fundraisers,
                           ContributionRepository contributions, ChatMessageRepository chatMessages,
                           ChatService chatService,
                           PasswordEncoder passwordEncoder) {
        this.users = users;
        this.groups = groups;
        this.memberships = memberships;
        this.gifts = gifts;
        this.subscriptions = subscriptions;
        this.notifications = notifications;
        this.fundraisers = fundraisers;
        this.contributions = contributions;
        this.chatMessages = chatMessages;
        this.chatService = chatService;
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
        subscriptions.findByTargetTypeAndTargetId(SubscriptionTargetType.USER, id)
                .forEach(s -> subscriptions.deleteById(s.getId()));
        notifications.findByUserIdOrderByCreatedAtDesc(id).forEach(n -> notifications.deleteById(n.getId()));
        fundraisers.findByTargetUserId(id).forEach(f -> {
            contributions.findByFundraiserId(f.getId()).forEach(c -> contributions.deleteById(c.getId()));
            fundraisers.deleteById(f.getId());
        });
        new ArrayList<>(chatMessages.findAll()).stream()
                .filter(m -> id.equals(m.getAuthorId()) || id.equals(m.getTargetUserId()))
                .forEach(m -> chatMessages.deleteById(m.getId()));
        users.deleteById(id);
    }

    @GetMapping("/groups")
    public List<Group> allGroups(@CurrentUser User me) {
        requireAdmin(me);
        return groups.findAll();
    }

    @PatchMapping("/groups/{id}")
    public Group updateGroup(@PathVariable Long id, @RequestBody AdminUpdateGroupRequest req, @CurrentUser User me) {
        requireAdmin(me);
        Group group = groups.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));
        if (req.name != null) {
            group.setName(req.name);
        }
        if (req.description != null) {
            group.setDescription(req.description);
        }
        return groups.save(group);
    }

    @DeleteMapping("/groups/{id}")
    public void deleteGroup(@PathVariable Long id, @CurrentUser User me) {
        requireAdmin(me);
        if (!groups.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }
        memberships.findByGroupId(id).forEach(m -> memberships.deleteById(m.getId()));
        subscriptions.findByTargetTypeAndTargetId(SubscriptionTargetType.GROUP, id)
                .forEach(s -> subscriptions.deleteById(s.getId()));
        groups.deleteById(id);
    }

    @GetMapping("/gifts")
    public List<Gift> allGifts(@CurrentUser User me) {
        requireAdmin(me);
        return gifts.findAll();
    }

    @PatchMapping("/gifts/{id}")
    public Gift updateGift(@PathVariable Long id, @RequestBody UpdateGiftRequest req, @CurrentUser User me) {
        requireAdmin(me);
        Gift gift = gifts.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gift not found"));
        if (req.title != null) {
            gift.setTitle(req.title);
        }
        if (req.description != null) {
            gift.setDescription(req.description);
        }
        if (req.url != null) {
            gift.setUrl(req.url);
        }
        if (req.price != null) {
            gift.setPrice(req.price);
        }
        if (req.status != null) {
            gift.setStatus(req.status);
        }
        return gifts.save(gift);
    }

    @DeleteMapping("/gifts/{id}")
    public void deleteGift(@PathVariable Long id, @CurrentUser User me) {
        requireAdmin(me);
        if (!gifts.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Gift not found");
        }
        gifts.deleteById(id);
    }

    @GetMapping("/fundraisers")
    public List<Fundraiser> allFundraisers(@CurrentUser User me) {
        requireAdmin(me);
        return fundraisers.findAll();
    }

    @PatchMapping("/fundraisers/{id}")
    public Fundraiser updateFundraiser(@PathVariable Long id, @RequestBody AdminUpdateFundraiserRequest req,
                                       @CurrentUser User me) {
        requireAdmin(me);
        Fundraiser fundraiser = fundraisers.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fundraiser not found"));
        if (req.targetUserId != null) {
            fundraiser.setTargetUserId(req.targetUserId);
        }
        if (req.giftId != null) {
            fundraiser.setGiftId(req.giftId);
        }
        if (req.title != null) {
            fundraiser.setTitle(req.title);
        }
        if (req.goalAmount != null) {
            fundraiser.setGoalAmount(req.goalAmount);
        }
        if (req.collectedAmount != null) {
            fundraiser.setCollectedAmount(req.collectedAmount);
        }
        if (req.deadline != null) {
            fundraiser.setDeadline(req.deadline);
        }
        if (req.status != null) {
            fundraiser.setStatus(req.status);
        }
        return fundraisers.save(fundraiser);
    }

    @DeleteMapping("/fundraisers/{id}")
    public void deleteFundraiser(@PathVariable Long id, @CurrentUser User me) {
        requireAdmin(me);
        if (!fundraisers.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Fundraiser not found");
        }
        contributions.findByFundraiserId(id).forEach(c -> contributions.deleteById(c.getId()));
        fundraisers.deleteById(id);
    }

    @GetMapping("/chats")
    public List<AdminChatRoomDto> allChats(@CurrentUser User me) {
        requireAdmin(me);
        Map<Long, User> usersById = users.findAll().stream()
                .collect(Collectors.toMap(User::getId, item -> item));
        Map<Long, List<ChatMessage>> grouped = new HashMap<>();
        for (ChatMessage message : chatMessages.findAll()) {
            grouped.computeIfAbsent(message.getTargetUserId(), key -> new ArrayList<>()).add(message);
        }

        return grouped.entrySet().stream()
                .map((entry) -> {
                    List<ChatMessage> items = entry.getValue();
                    items.sort(Comparator.comparing(ChatMessage::getCreatedAt));
                    ChatMessage last = items.get(items.size() - 1);
                    String name = usersById.containsKey(entry.getKey())
                            ? usersById.get(entry.getKey()).getName()
                            : "Пользователь #" + entry.getKey();
                    String preview = last.getText();
                    if (preview != null && preview.length() > 120) {
                        preview = preview.substring(0, 117) + "...";
                    }
                    return new AdminChatRoomDto(
                            entry.getKey(),
                            name,
                            items.size(),
                            last.getCreatedAt(),
                            preview
                    );
                })
                .sorted((left, right) -> {
                    long leftTime = left.lastMessageAt != null ? left.lastMessageAt.toEpochMilli() : 0L;
                    long rightTime = right.lastMessageAt != null ? right.lastMessageAt.toEpochMilli() : 0L;
                    return Long.compare(rightTime, leftTime);
                })
                .toList();
    }

    @GetMapping("/chats/{targetUserId}/messages")
    public List<ChatMessageDto> chatHistory(@PathVariable Long targetUserId, @CurrentUser User me) {
        requireAdmin(me);
        return chatService.history(targetUserId);
    }

    @PatchMapping("/messages/{id}")
    public ChatMessageDto updateMessage(@PathVariable Long id, @RequestBody AdminUpdateMessageRequest req,
                                        @CurrentUser User me) {
        requireAdmin(me);
        ChatMessage message = chatMessages.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
        if (req.text != null) {
            message.setText(req.text);
        }
        ChatMessage saved = chatMessages.save(message);
        String authorName = users.findById(saved.getAuthorId())
                .map(User::getName)
                .orElse("Пользователь #" + saved.getAuthorId());
        return new ChatMessageDto(
                saved.getId(),
                saved.getTargetUserId(),
                saved.getAuthorId(),
                authorName,
                saved.getText(),
                saved.getCreatedAt()
        );
    }

    @DeleteMapping("/messages/{id}")
    public void deleteMessage(@PathVariable Long id, @CurrentUser User me) {
        requireAdmin(me);
        if (!chatMessages.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found");
        }
        chatMessages.deleteById(id);
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
