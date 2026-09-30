/**
 * In-Memory Data Store for Smart Task Manager
 * 
 * Uses JavaScript Maps to store Users and Tasks in memory.
 * Pre-populated with realistic initial seed data for demonstration and testing.
 */

// User storage: Map<id, UserObject>
const users = new Map();

// Task storage: Map<id, TaskObject>
const tasks = new Map();

// Helper to generate unique IDs
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

/**
 * Seed initial sample users and tasks into the in-memory database
 */
function seedInitialData() {
  users.clear();
  tasks.clear();

  // 1. Initial Users (with roles: Admin vs Member)
  const sampleUsers = [
    {
      id: "usr_admin",
      username: "admin",
      name: "System Admin",
      email: "admin@taskmanager.io",
      avatarColor: "#6366F1", // Indigo
      role: "Admin",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_rahul",
      username: "rahul",
      name: "Rahul Sharma",
      email: "rahul@taskmanager.io",
      avatarColor: "#3B82F6", // Blue
      role: "Member",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_priya",
      username: "priya",
      name: "Priya Patel",
      email: "priya@taskmanager.io",
      avatarColor: "#EC4899", // Pink
      role: "Member",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_alex",
      username: "alex_dev",
      name: "Alex Rivera",
      email: "alex@taskmanager.io",
      avatarColor: "#10B981", // Emerald
      role: "Member",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_sarah",
      username: "sarah_arch",
      name: "Sarah Chen",
      email: "sarah@taskmanager.io",
      avatarColor: "#F59E0B", // Amber
      role: "Admin",
      createdAt: new Date().toISOString()
    }
  ];

  sampleUsers.forEach(user => users.set(user.id, user));

  // 2. Initial Tasks with Dependency Relationships
  // Role access rule: Admin sees all tasks; Member sees only assigned tasks.
  // Completion permission rule: Only the assigned member can mark their task as Done.

  // Task 1: High Priority - System Architecture (Done, assigned to Admin)
  const task1 = {
    id: "tsk_001",
    title: "System Architecture & API Specification",
    description: "Define REST API contracts, data models, and component hierarchy for the Task Manager.",
    priority: "High",
    status: "Done",
    assignedTo: "usr_admin",
    dependencies: [],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  };

  // Task 2: High Priority - Backend REST Service (In Progress, assigned to Rahul)
  const task2 = {
    id: "tsk_002",
    title: "Implement Node.js Express REST Backend",
    description: "Build in-memory state engine, dependency validation, cycle detection, and REST routes.",
    priority: "High",
    status: "In Progress",
    assignedTo: "usr_rahul",
    dependencies: ["tsk_001"],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  };

  // Task 3: Medium Priority - UI Design Tokens (In Progress, assigned to Priya)
  const task3 = {
    id: "tsk_003",
    title: "Design System & Dark Mode UI Tokens",
    description: "Create glassmorphic color palette, typography scales, and CSS variable design tokens.",
    priority: "Medium",
    status: "In Progress",
    assignedTo: "usr_priya",
    dependencies: ["tsk_001"],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  };

  // Task 4: High Priority - Frontend Task Board (To Do, assigned to Rahul)
  const task4 = {
    id: "tsk_004",
    title: "Next.js Interactive Task Dashboard UI",
    description: "Build modern dashboard with Kanban boards, dependency badges, and real-time state sync.",
    priority: "High",
    status: "To Do",
    assignedTo: "usr_rahul",
    dependencies: ["tsk_002", "tsk_003"],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  };

  // Task 5: Medium Priority - QA Integration Testing (To Do, assigned to Priya)
  const task5 = {
    id: "tsk_005",
    title: "End-to-End & Dependency Validation Testing",
    description: "Verify blocking rules, dependency cycle detection, user assignment, and UI filtering.",
    priority: "Medium",
    status: "To Do",
    assignedTo: "usr_priya",
    dependencies: ["tsk_004"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Task 6: Low Priority - Production CI/CD Deployment (To Do, assigned to Alex)
  const task6 = {
    id: "tsk_006",
    title: "Production Deployment & Performance Optimization",
    description: "Configure production build pipelines, optimize asset loading, and write documentation.",
    priority: "Low",
    status: "To Do",
    assignedTo: "usr_alex",
    dependencies: ["tsk_005"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  [task1, task2, task3, task4, task5, task6].forEach(task => tasks.set(task.id, task));

  console.log(`[InMemoryDB] Initialized ${users.size} users and ${tasks.size} tasks.`);
}

// Seed upon module load
seedInitialData();

module.exports = {
  users,
  tasks,
  generateId,
  seedInitialData
};
