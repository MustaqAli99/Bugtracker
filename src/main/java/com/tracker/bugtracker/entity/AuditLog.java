package com.tracker.bugtracker.entity;

import com.tracker.bugtracker.enums.TicketStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_user_id", nullable = false)
    private User changedBy;

    @Enumerated(EnumType.STRING)
    private TicketStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus newStatus;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime changedAt;
}
