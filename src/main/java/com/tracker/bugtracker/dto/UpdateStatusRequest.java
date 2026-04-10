package com.tracker.bugtracker.dto;

import com.tracker.bugtracker.enums.TicketStatus;
import lombok.Data;

@Data // Lombok annotation generates getters/setters automatically
public class UpdateStatusRequest {
    private TicketStatus newStatus;
    // In a real app with Spring Security, the userId comes from the JWT token.
    // For this portfolio build, we'll pass it in the request to simulate the logged-in user.
    private Long requestingUserId; 
}