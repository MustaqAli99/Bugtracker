	package com.tracker.bugtracker.dto;
	import lombok.Data;
	import java.time.LocalDateTime;
	
	@Data
	public class CommentDTO {
	    private Long id;
	    private String text;
	    private String authorName;
	    private String authorRole;
	    private LocalDateTime createdAt;
	}
	
	