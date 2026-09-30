/**
 * User Controller - Mock Authentication & User Management
 * 
 * Supports:
 * 1. Create a new user (in-memory)
 * 2. Login a user (mock auth, no hashing required as per spec)
 * 3. View all users with task statistics
 */

const { users, tasks, generateId } = require('../store/inMemoryDb');

const AVATAR_COLORS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B', 
  '#8B5CF6', '#3B82F6', '#EF4444', '#14B8A6'
];

/**
 * Get all users with task summary metrics
 */
const getUsers = (req, res) => {
  try {
    const userList = Array.from(users.values()).map(user => {
      const userTasks = Array.from(tasks.values()).filter(t => t.assignedTo === user.id);
      const doneTasks = userTasks.filter(t => t.status === 'Done').length;
      const inProgressTasks = userTasks.filter(t => t.status === 'In Progress').length;
      const todoTasks = userTasks.filter(t => t.status === 'To Do').length;

      return {
        ...user,
        stats: {
          totalAssigned: userTasks.length,
          done: doneTasks,
          inProgress: inProgressTasks,
          toDo: todoTasks
        }
      };
    });

    res.json({ success: true, count: userList.length, data: userList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get single user profile
 */
const getUserById = (req, res) => {
  try {
    const { id } = req.params;
    const user = users.get(id);

    if (!user) {
      return res.status(404).json({ success: false, message: `User with ID '${id}' not found.` });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a new user (Mock creation directly in in-memory database)
 */
const createUser = (req, res) => {
  try {
    const { username, name, email, role } = req.body;

    if (!username || !username.trim() || !name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Username and Full Name are required." 
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email ? email.trim().toLowerCase() : `${cleanUsername}@immverse.ai`;

    // Check for duplicate username
    const existing = Array.from(users.values()).find(
      u => u.username.toLowerCase() === cleanUsername
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `User with username '${username.trim()}' already exists.`
      });
    }

    const newId = generateId('usr');
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const newUser = {
      id: newId,
      username: username.trim(),
      name: name.trim(),
      email: cleanEmail,
      role: role ? role.trim() : 'Team Member',
      avatarColor: randomColor,
      createdAt: new Date().toISOString()
    };

    users.set(newId, newUser);

    res.status(201).json({
      success: true,
      message: `User '${newUser.name}' created successfully.`,
      data: newUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Login user (Mock authentication: switches or sets current user, no hashing required)
 */
const loginUser = (req, res) => {
  try {
    const { username, email, userId } = req.body;

    let user = null;

    if (userId) {
      user = users.get(userId);
    } else if (username) {
      const q = username.trim().toLowerCase();
      user = Array.from(users.values()).find(
        u => u.username.toLowerCase() === q || (u.email && u.email.toLowerCase() === q)
      );
    } else if (email) {
      const q = email.trim().toLowerCase();
      user = Array.from(users.values()).find(
        u => u.email && u.email.toLowerCase() === q
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please enter a valid username or create a new user."
      });
    }

    res.json({
      success: true,
      message: `Logged in as ${user.name}`,
      data: user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  loginUser
};
