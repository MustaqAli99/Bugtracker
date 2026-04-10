package com.tracker.bugtracker.controller;

import com.tracker.bugtracker.dto.*;
import com.tracker.bugtracker.entity.Ticket;
import com.tracker.bugtracker.enums.TicketStatus;
import com.tracker.bugtracker.service.TicketService;
import com.tracker.bugtracker.repository.TicketRepository;
import com.tracker.bugtracker.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import com.tracker.bugtracker.entity.Project;
import com.tracker.bugtracker.entity.User;
import com.tracker.bugtracker.repository.ProjectRepository;
import com.tracker.bugtracker.enums.Priority;
import com.tracker.bugtracker.enums.TicketType;
import com.tracker.bugtracker.enums.TicketStatus;
@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*") // Allows your frontend HTML to call this API
public class TicketController {

    @Autowired
    private TicketService ticketService;
    
    @Autowired
    private TicketRepository ticketRepository;

    /**
     * Endpoint 1: Get all tickets assigned to a specific developer.
     * The frontend dashboard will call this on page load.
     */
    @GetMapping("/assigned/{developerId}")
    public ResponseEntity<List<TicketResponseDTO>> getMyTickets(@PathVariable Long developerId) {
        List<Ticket> tickets = ticketRepository.findByAssigneeId(developerId);
        
        // Convert Entities to DTOs
        List<TicketResponseDTO> response = tickets.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint 2: The complex status update we built in the Service layer.
     * Uses PUT because we are updating an existing resource.
     */
    @PutMapping("/{ticketId}/status")
    public ResponseEntity<?> updateTicketStatus(
            @PathVariable Long ticketId, 
            @RequestBody UpdateStatusRequest request) {
        
        try {
            Ticket updatedTicket = ticketService.updateTicketStatus(
                    ticketId, 
                    request.getNewStatus(), 
                    request.getRequestingUserId()
            );
            return ResponseEntity.ok(convertToDTO(updatedTicket));
            
        } catch (SecurityException | IllegalStateException e) {
            // Return a 403 Forbidden or 400 Bad Request if they break the rules
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Endpoint 3: Get ALL tickets. 
     * Used by the Admin and QA dashboards.
     */
    @GetMapping
    public ResponseEntity<List<TicketResponseDTO>> getAllTickets() {
        List<Ticket> tickets = ticketRepository.findAll();
        
        List<TicketResponseDTO> response = tickets.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(response);
    }
    
    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Endpoint 4: Create a new Ticket (Used by QA)
     */
    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody CreateTicketRequest request) {
        try {
            // Now we fetch the EXACT project the QA selected!
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            
            User reporter = userRepository.findById(2L).orElseThrow(); // QA User
            User assignee = userRepository.findById(3L).orElseThrow(); // Dev User

            Ticket ticket = new Ticket();
            ticket.setTitle(request.getTitle());
            ticket.setDescription(request.getDescription());
            ticket.setPriority(request.getPriority());
            ticket.setType(TicketType.BUG);
            ticket.setStatus(TicketStatus.OPEN);
            ticket.setProject(project);
            ticket.setReporter(reporter);
            ticket.setAssignee(assignee);

            ticketRepository.save(ticket);
            return ResponseEntity.ok("Ticket Created!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating ticket: " + e.getMessage());
        }
    }

    /**
     * Helper method to map Entity -> DTO. 
     * In a massive enterprise app, you would use a library like MapStruct for this.
     */
    private TicketResponseDTO convertToDTO(Ticket ticket) {
        TicketResponseDTO dto = new TicketResponseDTO();
        dto.setId(ticket.getId());
        dto.setTitle(ticket.getTitle());
        dto.setDescription(ticket.getDescription());
        dto.setPriority(ticket.getPriority().name());
        dto.setStatus(ticket.getStatus().name());
        
        if (ticket.getProject() != null) {
            dto.setProjectName(ticket.getProject().getName());
        }
        if (ticket.getReporter() != null) {
            dto.setReporterName(ticket.getReporter().getUsername());
        }
        if (ticket.getAssignee() != null) {
            dto.setAssigneeName(ticket.getAssignee().getUsername());
        }
        dto.setUpdatedAt(ticket.getUpdatedAt());
        
        return dto;
    }
}