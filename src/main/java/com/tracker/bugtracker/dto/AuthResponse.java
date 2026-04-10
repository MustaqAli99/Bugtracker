package com.tracker.bugtracker.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private Long id;
    private String username;
    private String role; // ADMIN, QA, DEVELOPER
}
