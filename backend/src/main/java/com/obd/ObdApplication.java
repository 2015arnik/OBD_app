package com.obd;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point of the whole backend.
 * @SpringBootApplication turns on auto-configuration, component scanning and configuration.
 * @EnableScheduling lets us run the daily birthday-reminder job (see scheduler package).
 */
@SpringBootApplication
@EnableScheduling
public class ObdApplication {
    public static void main(String[] args) {
        SpringApplication.run(ObdApplication.class, args);
    }
}
