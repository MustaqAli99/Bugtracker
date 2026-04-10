package com.tracker.bugtracker.controller;

import com.tracker.bugtracker.entity.Project;
import com.tracker.bugtracker.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*") // Allows the frontend to connect
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    /**
     * Endpoint for Admin to create a new project
     */
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Project project) {
        try {
            // Save the new project to the database
            Project savedProject = projectRepository.save(project);
            return ResponseEntity.ok("Project Created Successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating project: " + e.getMessage());
        }
    }
    /**
     * Endpoint to get all projects for the QA dropdown menu
     */
    @GetMapping
    public ResponseEntity<?> getAllProjects() {
        return ResponseEntity.ok(projectRepository.findAll());
    }
}