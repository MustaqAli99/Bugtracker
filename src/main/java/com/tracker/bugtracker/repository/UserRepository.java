package com.tracker.bugtracker.repository;

import com.tracker.bugtracker.entity.*;
import com.tracker.bugtracker.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}

