package com.tracker.bugtracker.dto;
import com.tracker.bugtracker.enums.Priority;
import lombok.Data;

@Data
public class CreateTicketRequest {
    private String title;
    private String description;
    private Priority priority;
    private Long projectId; // We added this!
}