package com.tracker.bugtracker.dto;

import lombok.Data;

@Data
public class CreateCommentRequest {
    private String text;
    private Long authorId;
}
