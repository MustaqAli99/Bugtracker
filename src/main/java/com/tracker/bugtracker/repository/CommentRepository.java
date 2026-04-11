package com.tracker.bugtracker.repository;

import com.tracker.bugtracker.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    // Spring Data JPA magic: This automatically writes the SQL to find comments by ticket ID and sort them!
    List<Comment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}