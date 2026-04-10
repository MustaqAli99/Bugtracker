package com.tracker.bugtracker.service;

import com.tracker.bugtracker.entity.*;
import com.tracker.bugtracker.enums.*;
import com.tracker.bugtracker.exception.InvalidStateTransitionException;
import com.tracker.bugtracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Core feature: Updating a ticket status with RBAC and Audit Logging.
     * The @Transactional annotation ensures that if the audit log fails to save, 
     * the ticket status update is rolled back. No orphan data!
     */
    @Transactional
    public Ticket updateTicketStatus(Long ticketId, TicketStatus newStatus, Long requestingUserId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        User requestingUser = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TicketStatus oldStatus = ticket.getStatus();

        // 1. Role-Based Access Control (RBAC) Checks
        validatePermissions(requestingUser, oldStatus, newStatus);

        // 2. State Machine Validation
        validateStateTransition(oldStatus, newStatus);

        // 3. Update the Ticket
        ticket.setStatus(newStatus);
        Ticket updatedTicket = ticketRepository.save(ticket);

        // 4. Generate the Audit Log
        AuditLog log = new AuditLog();
        log.setTicket(updatedTicket);
        log.setChangedBy(requestingUser);
        log.setOldStatus(oldStatus);
        log.setNewStatus(newStatus);
        auditLogRepository.save(log);

        return updatedTicket;
    }

    /**
     * Prevents developers from closing tickets (Only QA/Admin can)
     */
    private void validatePermissions(User user, TicketStatus oldStatus, TicketStatus newStatus) {
        if (user.getRole() == Role.DEVELOPER) {
            if (newStatus == TicketStatus.CLOSED || newStatus == TicketStatus.RESOLVED) {
                throw new SecurityException("Developers cannot mark tickets as Resolved or Closed. Send to TESTING.");
            }
        }
    }

    /**
     * Enforces the strict flow: OPEN -> IN_PROGRESS -> TESTING -> RESOLVED -> CLOSED
     */
    private void validateStateTransition(TicketStatus oldStatus, TicketStatus newStatus) {
        if (oldStatus == newStatus) return; // No change

        boolean isValid = switch (oldStatus) {
            case OPEN -> newStatus == TicketStatus.IN_PROGRESS;
            case IN_PROGRESS -> newStatus == TicketStatus.TESTING;
            case TESTING -> newStatus == TicketStatus.RESOLVED || newStatus == TicketStatus.IN_PROGRESS; // Can fail testing and go back
            case RESOLVED -> newStatus == TicketStatus.CLOSED || newStatus == TicketStatus.OPEN; // Reopened
            case CLOSED -> false; // Closed tickets cannot be changed
        };

        if (!isValid) {
            throw new InvalidStateTransitionException(
                "Cannot transition ticket from " + oldStatus + " directly to " + newStatus);
        }
    }
}