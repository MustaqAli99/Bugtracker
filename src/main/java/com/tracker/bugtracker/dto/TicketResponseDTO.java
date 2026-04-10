package com.tracker.bugtracker.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TicketResponseDTO {
    private Long id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String projectName;
    private String reporterName;
    private String assigneeName;
    private LocalDateTime updatedAt;
}