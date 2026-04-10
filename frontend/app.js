const API_BASE_URL = 'http://localhost:8080/api/tickets';

// 1. Authentication Check
const userJson = localStorage.getItem('currentUser');
if (!userJson) {
    window.location.href = 'login.html';
}
const currentUser = JSON.parse(userJson);

// 2. Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('user-info').innerHTML = 
        `Logged in as: <strong>${currentUser.username} (${currentUser.role})</strong> 
         <button onclick="logout()" style="margin-left:10px;">Logout</button>`;

    setupRoleUI();
});

// Logout
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Role-based UI
function setupRoleUI() {
    const headerTitle = document.getElementById('dashboard-title');
    const controls = document.getElementById('role-controls');

    if (!headerTitle || !controls) {
        console.error("Missing required HTML elements");
        return;
    }

    if (currentUser.role === 'DEVELOPER') {
        headerTitle.innerText = "My Assigned Tickets";
        controls.innerHTML = `
            <h2 id="dashboard-title">My Assigned Tickets</h2>
            <button onclick="setupRoleUI()" class="refresh-btn">Refresh Data</button>
        `;
        fetchTickets(`${API_BASE_URL}/assigned/${currentUser.id}`);
    } 
    else if (currentUser.role === 'QA') {
        headerTitle.innerText = "All System Tickets";
        controls.innerHTML = `
            <h2 id="dashboard-title">All System Tickets</h2>
            <button class="action-btn" style="background:#e74c3c;" onclick="openBugModal()">+ Report New Bug</button>
        `;
        fetchAllTickets();
    } 
   else if (currentUser.role === 'ADMIN') {
        headerTitle.innerText = "Admin Overview";
        controls.innerHTML = `
            <button class="action-btn" style="background:#8e44ad;" onclick="openProjectModal()">+ Create Project</button>
            <button class="action-btn" style="background:#2980b9;" onclick="alert('User Management module is planned for Phase 2!')">Manage Users</button>
        `;
        fetchAllTickets();
    }
}

// Fetch Tickets
async function fetchTickets(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");
        const tickets = await response.json();
        renderTickets(tickets);
    } catch (error) {
        console.error(error);
    }
}

function fetchAllTickets() {
    fetchTickets(API_BASE_URL);
}

// Render Tickets
function renderTickets(tickets) {
    const activeContainer = document.getElementById('ticket-container');
    const closedContainer = document.getElementById('closed-ticket-container');
    
    activeContainer.innerHTML = ''; 
    closedContainer.innerHTML = ''; 

    if (tickets.length === 0) {
        activeContainer.innerHTML = '<p>No tickets found.</p>';
        return;
    }

    // Split tickets into Active and Closed buckets
    const activeTickets = tickets.filter(t => t.status !== 'CLOSED');
    const closedTickets = tickets.filter(t => t.status === 'CLOSED');

    // Render Active Tickets
    if (activeTickets.length === 0) {
        activeContainer.innerHTML = '<p>No active tickets! Great job.</p>';
    } else {
        activeTickets.forEach(ticket => activeContainer.appendChild(createTicketCard(ticket)));
    }

    // Render Closed Tickets
    if (closedTickets.length === 0) {
        closedContainer.innerHTML = '<p>No closed tickets yet.</p>';
    } else {
        closedTickets.forEach(ticket => closedContainer.appendChild(createTicketCard(ticket)));
    }
}

// Helper function to build the HTML for a single card to keep code clean
function createTicketCard(ticket) {
    const card = document.createElement('div');
    card.className = 'ticket-card';
    
    let actionButtonHtml = '';
    
    // Role-based button logic (Only show buttons if the ticket is NOT closed)
    if (ticket.status !== 'CLOSED') {
        if (currentUser.role === 'DEVELOPER') {
            if (ticket.status === 'OPEN') {
                actionButtonHtml = `<button class="action-btn" onclick="updateStatus(${ticket.id}, 'IN_PROGRESS')">Start Work</button>`;
            } else if (ticket.status === 'IN_PROGRESS') {
                actionButtonHtml = `<button class="action-btn" onclick="updateStatus(${ticket.id}, 'TESTING')">Send to QA</button>`;
            }
        } 
        else if (currentUser.role === 'QA' || currentUser.role === 'ADMIN') {
            if (ticket.status === 'TESTING') {
                actionButtonHtml = `
                    <button class="action-btn" onclick="updateStatus(${ticket.id}, 'RESOLVED')">Approve Fix</button>
                    <button class="action-btn" style="background:#e74c3c; margin-top:5px;" onclick="updateStatus(${ticket.id}, 'IN_PROGRESS')">Reject (Send back to Dev)</button>
                `;
            } else if (ticket.status === 'RESOLVED') {
                 actionButtonHtml = `<button class="action-btn" style="background:#34495e;" onclick="updateStatus(${ticket.id}, 'CLOSED')">Close Ticket</button>`;
            }
        }
    } else {
        // If it is closed, show a disabled visual indicator instead of a button
        actionButtonHtml = `<p style="color: green; font-weight: bold;">✔ Ticket Closed</p>`;
    }

    card.innerHTML = `
        <span class="badge priority-${ticket.priority}">${ticket.priority}</span>
        <span class="badge status-${ticket.status}">${ticket.status.replace('_', ' ')}</span>
        <h3>${ticket.title}</h3>
        <div class="ticket-meta">Project: <strong>${ticket.projectName}</strong> | Assignee: ${ticket.assigneeName || 'Unassigned'}</div>
        <p>${ticket.description}</p>
        ${actionButtonHtml}
    `;
    return card;
}

// Update Status
async function updateStatus(ticketId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/${ticketId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                newStatus: newStatus, 
                requestingUserId: currentUser.id 
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            alert(`⚠️ Cannot update ticket:\n${errorText}`);
            return;
        }

        setupRoleUI();

    } catch (error) {
        console.error("Network error:", error);
        alert("⚠️ Failed to connect to server.");
    }
}

// ===== MODAL FUNCTIONS =====

// Opens the modal window AND fetches the projects from the Admin's list!
async function openBugModal() {
    document.getElementById('bugModal').style.display = 'block';
    
    try {
        const response = await fetch('http://localhost:8080/api/projects');
        const projects = await response.json();
        
        const projectDropdown = document.getElementById('bugProject');
        projectDropdown.innerHTML = '<option value="">-- Select a Project --</option>'; // clear loading text
        
        // Populate the dropdown with the real projects from the database
        projects.forEach(proj => {
            projectDropdown.innerHTML += `<option value="${proj.id}">${proj.name}</option>`;
        });
        
    } catch (error) {
        console.error("Failed to load projects", error);
    }
}

// Close modal
function closeBugModal() {
    document.getElementById('bugModal').style.display = 'none';
}

// Sends the data to Spring Boot
async function submitNewBug() {
    const projectId = document.getElementById('bugProject').value;
    const title = document.getElementById('bugTitle').value;
    const desc = document.getElementById('bugDesc').value;
    const priority = document.getElementById('bugPriority').value;

    if (!title || !desc || !projectId) {
        alert("Please fill out all fields and select a project!");
        return;
    }

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                description: desc,
                priority: priority,
                projectId: projectId // Sending the selected project ID!
            })
        });

        if (response.ok) {
            alert("Bug reported successfully!");
            document.getElementById('bugModal').style.display = 'none';
            document.getElementById('bugTitle').value = '';
            document.getElementById('bugDesc').value = '';
            setupRoleUI();
        } else {
            alert("Failed to report bug.");
        }
    } catch (error) {
        console.error(error);
        alert("Network error.");
    }
}

// --- ADMIN FUNCTIONS ---

// Opens the project modal window
function openProjectModal() {
    document.getElementById('projectModal').style.display = 'block';
}

// Sends the project data to Spring Boot
async function submitNewProject() {
    const name = document.getElementById('projectName').value;
    const desc = document.getElementById('projectDesc').value;

    if (!name) {
        alert("Project Name is required!");
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                description: desc
            })
        });

        if (response.ok) {
            alert("Project created successfully!");
            document.getElementById('projectModal').style.display = 'none';
            // Clear the form
            document.getElementById('projectName').value = '';
            document.getElementById('projectDesc').value = '';
        } else {
            const err = await response.text();
            alert("Failed to create project: " + err);
        }
    } catch (error) {
        console.error("Network error:", error);
        alert("Failed to connect to the server.");
    }
}