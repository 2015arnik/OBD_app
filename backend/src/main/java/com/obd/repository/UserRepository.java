package com.obd.repository;

import com.obd.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/** Spring Data JPA writes the SQL for us based on the method names. */
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
