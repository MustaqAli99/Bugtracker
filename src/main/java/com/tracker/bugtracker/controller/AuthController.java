package com.tracker.bugtracker.controller;

import com.tracker.bugtracker.dto.AuthResponse;
import com.tracker.bugtracker.dto.LoginRequest;
import com.tracker.bugtracker.entity.User;
import com.tracker.bugtracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Find user by email (we need to add findByEmail to UserRepository if not there)
        User user = userRepository.findAll().stream()
                .filter(u -> u.getEmail().equals(request.getEmail()))
                .findFirst()
                .orElse(null);

        // Check if user exists and password matches
        if (user != null && user.getPassword().equals(request.getPassword())) {
            AuthResponse response = new AuthResponse();
            response.setId(user.getId());
            response.setUsername(user.getUsername());
            response.setRole(user.getRole().name());
            
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
    }
}