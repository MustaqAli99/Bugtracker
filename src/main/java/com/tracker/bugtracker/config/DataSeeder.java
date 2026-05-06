package com.tracker.bugtracker.config;

import com.tracker.bugtracker.entity.*;
import com.tracker.bugtracker.enums.*;
import com.tracker.bugtracker.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            ProjectRepository projectRepository,
            TicketRepository ticketRepository) {

        return args -> {
            // 1. Create Users if the database is empty
            if (userRepository.count() == 0) {
                User admin = new User(null, "admin", "admin@test.com", "pass", Role.ADMIN, null);
                User qa = new User(null, "qa_jenny", "qa@test.com", "pass", Role.QA, null);
                User dev = new User(null, "DevUser", "dev@test.com", "pass", Role.DEVELOPER, null);

                userRepository.save(admin);
                userRepository.save(qa);
                userRepository.save(dev);

                // 2. Create a Project
                Project project = new Project(null, "E-Commerce Payment Gateway", "Upgrading the checkout system", null);
                projectRepository.save(project);

                // 3. Create Tickets and assign them to the Developer (DevUser)
                Ticket t1 = new Ticket(null, "Stripe API Timeout", "Payments are failing after 30 seconds.", 
                        TicketType.BUG, Priority.CRITICAL, TicketStatus.OPEN, 
                        project, qa, dev, null, null);

                Ticket t2 = new Ticket(null, "Add PayPal button", "UI needs a new button on the cart page.", 
                        TicketType.FEATURE, Priority.LOW, TicketStatus.IN_PROGRESS, 
                        project, admin, dev, null, null);

                ticketRepository.save(t1);
                ticketRepository.save(t2);
                
                System.out.println("✅ Mock Data Seeded Successfully!");
            }
        };
    }
}