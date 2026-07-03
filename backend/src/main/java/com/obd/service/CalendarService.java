package com.obd.service;

import com.obd.model.User;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CalendarService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    public String forUser(User user) {
        StringBuilder sb = new StringBuilder();
        header(sb);
        event(sb, user);
        footer(sb);
        return sb.toString();
    }

    public String forUsers(List<User> people) {
        StringBuilder sb = new StringBuilder();
        header(sb);
        for (User u : people) {
            event(sb, u);
        }
        footer(sb);
        return sb.toString();
    }

    public String googleLink(User user) {
        if (user.getBirthDate() == null) {
            return "";
        }
        LocalDate start = MonthDay.from(user.getBirthDate()).atYear(LocalDate.now().getYear());
        LocalDate end = start.plusDays(1);
        String text = encode("День рождения: " + safeName(user.getName()));
        return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + text
                + "&dates=" + start.format(DATE) + "/" + end.format(DATE)
                + "&recur=RRULE:FREQ=YEARLY";
    }

    private void header(StringBuilder sb) {
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//OBD//Birthday Planner//RU\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
    }

    private void footer(StringBuilder sb) {
        sb.append("END:VCALENDAR\r\n");
    }

    private void event(StringBuilder sb, User user) {
        if (user.getBirthDate() == null) {
            return;
        }
        LocalDate start = MonthDay.from(user.getBirthDate()).atYear(LocalDate.now().getYear());
        sb.append("BEGIN:VEVENT\r\n");
        sb.append("UID:birthday-").append(user.getId()).append("@obd.app\r\n");
        sb.append("DTSTART;VALUE=DATE:").append(start.format(DATE)).append("\r\n");
        sb.append("RRULE:FREQ=YEARLY\r\n");
        sb.append("SUMMARY:").append(escape("День рождения: " + safeName(user.getName()))).append("\r\n");
        sb.append("END:VEVENT\r\n");
    }

    private String safeName(String name) {
        return name == null ? "" : name;
    }

    private String escape(String text) {
        return text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n");
    }

    private String encode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
