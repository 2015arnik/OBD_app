package com.obd.web;

import com.obd.dto.CreateGiftRequest;
import com.obd.dto.UpdateGiftRequest;
import com.obd.model.Gift;
import com.obd.model.User;
import com.obd.repository.GiftRepository;
import com.obd.security.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class GiftController {

    private final GiftRepository gifts;

    public GiftController(GiftRepository gifts) {
        this.gifts = gifts;
    }

    /** Wishlist of a given user. */
    @GetMapping("/users/{id}/gifts")
    public List<Gift> ofUser(@PathVariable Long id) {
        return gifts.findByOwnerId(id);
    }

    /** Publish a gift on your own wishlist. */
    @PostMapping("/gifts")
    public Gift create(@Valid @RequestBody CreateGiftRequest req, @CurrentUser User me) {
        Gift g = new Gift();
        g.setOwnerId(me.getId());
        g.setTitle(req.title);
        g.setDescription(req.description);
        g.setUrl(req.url);
        g.setPrice(req.price);
        return gifts.save(g);
    }

    /**
     * Update a gift. Anyone logged in may change the status (e.g. reserve it),
     * but only the owner may edit the text fields.
     */
    @PatchMapping("/gifts/{id}")
    public Gift update(@PathVariable Long id, @RequestBody UpdateGiftRequest req, @CurrentUser User me) {
        Gift g = gifts.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gift not found"));

        boolean editsText = req.title != null || req.description != null || req.url != null || req.price != null;
        if (editsText && !g.getOwnerId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can edit gift details");
        }
        if (req.title != null) {
            g.setTitle(req.title);
        }
        if (req.description != null) {
            g.setDescription(req.description);
        }
        if (req.url != null) {
            g.setUrl(req.url);
        }
        if (req.price != null) {
            g.setPrice(req.price);
        }
        if (req.status != null) {
            g.setStatus(req.status);
        }
        return gifts.save(g);
    }

    /** Delete a gift from your own wishlist. */
    @DeleteMapping("/gifts/{id}")
    public void delete(@PathVariable Long id, @CurrentUser User me) {
        Gift g = gifts.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gift not found"));
        if (!g.getOwnerId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can delete a gift");
        }
        gifts.deleteById(id);
    }
}
