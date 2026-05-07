const BACKEND_BASE_URL = 'https://bugtracker-l9d1.onrender.com';
const API_BASE_URL = `${BACKEND_BASE_URL}/api/tickets`;

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

    } else if (currentUser.role === 'QA') {

        headerTitle.innerText = "All System Tickets";

        controls.innerHTML = `
            <h2 id="dashboard-title">All System Tickets</h2>
            <button class="action-btn" style="background:#e74c3c;" onclick="openBugModal()">+ Report New Bug</button>
        `;

        fetchAllTickets();

    } else if (currentUser.role === 'ADMIN') {

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

        if (!response.ok) {
            throw new Error("Failed to fetch tickets");
        }

        const tickets = await response.json();

        renderTickets(tickets);

    } catch (error) {

        console.error("Error fetching tickets:", error);

        alert("Failed to load tickets from server.");
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
        activeTickets.forEach(ticket =>
            activeContainer.appendChild(createTicketCard(ticket))
        );
    }

    // Render Closed Tickets
    if (closedTickets.length === 0) {
        closedContainer.innerHTML = '<p>No closed tickets yet.</p>';
    } else {
        closedTickets.forEach(ticket =>
            closedContainer.appendChild(createTicketCard(ticket))
        );
    }
}

// Helper function to build ticket card
function createTicketCard(ticket) {

    const card = document.createElement('div');
    card.className = 'ticket-card';

    let actionButtonHtml = '';

    // Role-based button logic
    if (ticket.status !== 'CLOSED') {

        if (currentUser.role === 'DEVELOPER') {

            if (ticket.status === 'OPEN') {

                actionButtonHtml =
                    `<button class="action-btn" onclick="updateStatus(${ticket.id}, 'IN_PROGRESS')">Start Work</button>`;

            } else if (ticket.status === 'IN_PROGRESS') {

                actionButtonHtml =
                    `<button class="action-btn" onclick="updateStatus(${ticket.id}, 'TESTING')">Send to QA</button>`;
            }

        } else if (currentUser.role === 'QA' || currentUser.role === 'ADMIN') {

            if (ticket.status === 'TESTING') {

                actionButtonHtml = `
                    <button class="action-btn" onclick="updateStatus(${ticket.id}, 'RESOLVED')">Approve Fix</button>

                    <button class="action-btn" 
                            style="background:#e74c3c; margin-top:5px;" 
                            onclick="updateStatus(${ticket.id}, 'IN_PROGRESS')">
                            Reject (Send back to Dev)
                    </button>
                `;

            } else if (ticket.status === 'RESOLVED') {

                actionButtonHtml =
                    `<button class="action-btn" style="background:#34495e;" onclick="updateStatus(${ticket.id}, 'CLOSED')">Close Ticket</button>`;
            }
        }

    } else {

        actionButtonHtml =
            `<p style="color: green; font-weight: bold;">✔ Ticket Closed</p>`;
    }

    // Comments button
    actionButtonHtml += `
        <button class="action-btn" 
                style="background:#34495e; margin-top:10px;"
                onclick="openDetailsModal(
                    ${ticket.id},
                    '${ticket.title.replace(/'/g, "\\'")}',
                    '${ticket.description.replace(/'/g, "\\'")}'
                )">
                View Details & Comments
        </button>
    `;

    card.innerHTML = `
        <span class="badge priority-${ticket.priority}">
            ${ticket.priority}
        </span>

        <span class="badge status-${ticket.status}">
            ${ticket.status.replace('_', ' ')}
        </span>

        <h3>${ticket.title}</h3>

        <div class="ticket-meta">
            Project: <strong>${ticket.projectName}</strong> |
            Assignee: ${ticket.assigneeName || 'Unassigned'}
        </div>

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

            headers: {
                'Content-Type': 'application/json'
            },

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

// ===== BUG MODAL FUNCTIONS =====

// Open bug modal
async function openBugModal() {

    document.getElementById('bugModal').style.display = 'block';

    try {

        const response = await fetch(`${BACKEND_BASE_URL}/api/projects`);

        const projects = await response.json();

        const projectDropdown = document.getElementById('bugProject');

        projectDropdown.innerHTML =
            '<option value="">-- Select a Project --</option>';

        projects.forEach(proj => {

            projectDropdown.innerHTML += `
                <option value="${proj.id}">
                    ${proj.name}
                </option>
            `;
        });

    } catch (error) {

        console.error("Failed to load projects", error);

        alert("Failed to load projects.");
    }
}

// Close bug modal
function closeBugModal() {
    document.getElementById('bugModal').style.display = 'none';
}

// Submit new bug
async function submitNewBug() {

    const projectId = document.getElementById('bugProject').value;
    const title = document.getElementById('bugTitle').value;
    const desc = document.getElementById('bugDesc').value;
    const priority = document.getElementById('bugPriority').value;

    if (!title || !desc || !projectId) {

        alert("Please fill all fields.");

        return;
    }

    try {

        const response = await fetch(API_BASE_URL, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                title,
                description: desc,
                priority,
                projectId
            })
        });

        if (response.ok) {

            alert("Bug reported successfully!");

            closeBugModal();

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

// ===== ADMIN FUNCTIONS =====

// Open project modal
function openProjectModal() {
    document.getElementById('projectModal').style.display = 'block';
}

// Submit new project
async function submitNewProject() {

    const name = document.getElementById('projectName').value;
    const desc = document.getElementById('projectDesc').value;

    if (!name) {

        alert("Project Name is required!");

        return;
    }

    try {

        const response = await fetch(`${BACKEND_BASE_URL}/api/projects`, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                name,
                description: desc
            })
        });

        if (response.ok) {

            alert("Project created successfully!");

            document.getElementById('projectModal').style.display = 'none';

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

// ===== COMMENTS SYSTEM =====

let activeTicketIdForComments = null;

// Open details modal
async function openDetailsModal(ticketId, title, description) {

    activeTicketIdForComments = ticketId;

    document.getElementById('detailsTitle').innerText = title;
    document.getElementById('detailsDesc').innerText = description;

    document.getElementById('detailsModal').style.display = 'block';

    document.getElementById('newCommentText').value = '';

    document.getElementById('commentsList').innerHTML = '<p>Loading...</p>';

    fetchComments(ticketId);
}

// Fetch comments
async function fetchComments(ticketId) {

    try {

        const response = await fetch(`${API_BASE_URL}/${ticketId}/comments`);

        if (!response.ok) {
            throw new Error("Failed to fetch comments");
        }

        const comments = await response.json();

        renderComments(comments);

    } catch (error) {

        console.error(error);

        document.getElementById('commentsList').innerHTML =
            '<p style="color:red;">Error loading comments.</p>';
    }
}

// Render comments
function renderComments(comments) {

    const container = document.getElementById('commentsList');

    container.innerHTML = '';

    if (comments.length === 0) {

        container.innerHTML =
            '<p style="color: #999; font-style: italic;">No comments yet.</p>';

        return;
    }

    comments.forEach(comment => {

        const dateString =
            new Date(comment.createdAt).toLocaleString();

        container.innerHTML += `
            <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">

                <div style="font-size: 0.85rem; color: #777; margin-bottom: 5px;">

                    <strong style="color: #2c3e50;">
                        ${comment.authorName} (${comment.authorRole})
                    </strong>

                    • ${dateString}
                </div>

                <div style="font-size: 0.95rem;">
                    ${comment.text}
                </div>
            </div>
        `;
    });

    container.scrollTop = container.scrollHeight;
}

// Submit comment
async function submitComment() {

    const text = document.getElementById('newCommentText').value;

    if (!text.trim()) {

        alert("Cannot post an empty comment!");

        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/${activeTicketIdForComments}/comments`,
            {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    text: text,
                    authorId: currentUser.id
                })
            }
        );

        if (response.ok) {

            document.getElementById('newCommentText').value = '';

            fetchComments(activeTicketIdForComments);

        } else {

            alert("Failed to post comment.");
        }

    } catch (error) {

        console.error("Network error:", error);

        alert("Failed to connect to the server.");
    }
}