package com.tracker.bugtracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tracker.bugtracker.entity.Ticket;
import com.tracker.bugtracker.enums.TicketStatus;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    // Custom queries for the frontend dashboard
    List<Ticket> findByAssigneeId(Long assigneeId);
    List<Ticket> findByProjectId(Long projectId);
    List<Ticket> findByStatus(TicketStatus status);
}	