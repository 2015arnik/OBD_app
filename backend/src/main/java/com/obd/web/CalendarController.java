package com.obd.web;

import com.obd.model.User;
import com.obd.repository.UserRepository;
import com.obd.service.CalendarService;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class CalendarController {

    private final UserRepository users;
    private final CalendarService calendarService;

    public CalendarController(UserRepository users, CalendarService calendarService) {
        this.users = users;
        this.calendarService = calendarService;
    }

    @GetMapping(value = "/users/{id}/calendar.ics", produces = "text/calendar")
    public ResponseEntity<String> userCalendar(@PathVariable Long id) {
        User user = users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getBirthDate() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User has no birth date");
        }
        return icsResponse(calendarService.forUser(user), "birthday-" + id + ".ics");
    }

    @GetMapping(value = "/calendar/birthdays.ics", produces = "text/calendar")
    public ResponseEntity<String> allBirthdays() {
        return icsResponse(calendarService.forUsers(users.findAll()), "birthdays.ics");
    }

    @GetMapping("/users/{id}/calendar/google")
    public Map<String, String> googleLink(@PathVariable Long id) {
        User user = users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return Map.of("url", calendarService.googleLink(user));
    }

    private ResponseEntity<String> icsResponse(String body, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/calendar; charset=UTF-8"))
                .body(body);
    }
}
