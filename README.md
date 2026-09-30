# Smart Task Manager

A full-stack, real-time state driven Task Management Web Application built with **Next.js (React)** for the frontend and **Node.js (Express.js)** for the backend with an in-memory data engine.

---

## 📌 Features & Business Logic

### User Management
- **Create Users**: Register new users with full name, username, email, and job role.
- **Mock Authentication**: Instant user profile switching via top navigation session dropdown.
- **User Workload Roster**: Overview of all team members with real-time stats on assigned, completed, and in-progress tasks.

### Task Management & Dependency Engine
- **Task CRUD**: Create, read, update, and delete tasks with attributes: *Title, Description, Priority (Low/Medium/High), Status (To Do/In Progress/Done), Assignee, and Dependencies*.
- **Prerequisite Blocking Rule**: A task **cannot be marked as 'Done'** until all of its prerequisite dependencies are completed (`Done`). Attempting to complete a blocked task returns a strict validation error with details on the blocking tasks.
- **Circular Dependency Cycle Prevention**: Includes Depth-First Search (DFS) graph traversal in the backend to prevent circular dependency loops (e.g. Task A ➔ Task B ➔ Task A).
- **My Tasks View**: Dedicated workspace tab filtered specifically to the currently logged-in user.
- **Blocked Tasks View**: Highlights tasks impeded by unfinished prerequisite dependencies, complete with one-click resolution.
- **Dependency Topology Map**: Interactive visual DAG (Directed Acyclic Graph) showing prerequisite connections between tasks.
- **Multi-Criteria UI Filtering**: Real-time search bar and filter dropdowns for Priority, Status, Assignee, and Dependency states.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (React App Router), Vanilla CSS Design System with CSS variables and glassmorphic UI, Lucide Icons.
- **Backend**: Node.js, Express.js REST API.
- **Database**: In-Memory state management using JavaScript ES6 `Map` data structures.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation & Running

1. **Install Dependencies**:
   ```bash
   # Install root, backend, and frontend dependencies
   npm run install:all
   ```

2. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   This concurrently launches:
   - 🌐 **Frontend (Next.js)**: [http://localhost:3000](http://localhost:3000)
   - 🚀 **Backend API (Express)**: [http://localhost:5000](http://localhost:5000)

3. **Run API Integration Tests**:
   ```bash
   node testApi.js
   ```

---

## 📡 API Endpoints Reference

### Users (`/api/users`)
- `GET /api/users` - Fetch all users with workload summary statistics.
- `GET /api/users/:id` - Fetch single user profile.
- `POST /api/users` - Register a new user (`username`, `name`, `email`, `role`).
- `POST /api/users/login` - Simulate user authentication session.

### Tasks (`/api/tasks`)
- `GET /api/tasks` - List all tasks (supports query params: `priority`, `status`, `assignedTo`, `isBlocked`, `search`).
- `GET /api/tasks/user/:userId` - Get tasks assigned to a specific user.
- `GET /api/tasks/blocked` - Get all blocked tasks.
- `GET /api/tasks/graph` - Get dependency graph topology (nodes & links).
- `POST /api/tasks` - Create a new task.
- `PUT /api/tasks/:id` - Update task attributes & status (enforces dependency validation rules).
- `DELETE /api/tasks/:id` - Delete a task (cleans up dependency references).
- `POST /api/reset` - Reset state back to initial seed dataset.

---

## 📂 Project Structure

```
smart-task-manager/
├── backend/
│   ├── server.js               # Express application entrypoint
│   ├── controllers/            # User & Task route handlers
│   ├── routes/                 # Express API router definitions
│   ├── store/                  # In-memory Map store & seed data
│   └── utils/                  # DFS Cycle detection & dependency blocking checks
├── frontend/
│   ├── app/                    # Next.js App Router pages & CSS design system
│   ├── components/             # Reusable UI components (Kanban, Cards, Modals, Graph)
│   ├── context/                # App Context & state management
│   └── lib/                    # API client helper
├── testApi.js                  # Integration test script
└── package.json                # Root package configuration
```
