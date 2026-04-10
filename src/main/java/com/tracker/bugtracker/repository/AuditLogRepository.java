package com.tracker.bugtracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tracker.bugtracker.entity.AuditLog;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    // To show the history of a specific bug
    List<AuditLog> findByTicketIdOrderByChangedAtDesc(Long ticketId);
}