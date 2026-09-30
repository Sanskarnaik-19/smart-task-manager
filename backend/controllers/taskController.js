/**
 * Task Controller
 * Handles task creation, updates, deletion, filtering, dependency validation, 
 * state-machine progression (To Do -> In Progress -> Done), priority-based task completion/selection,
 * and role-based access control (Admin vs Member).
 */

const { tasks, users, generateId, seedInitialData } = require('../store/inMemoryDb');
const { 
  checkDependenciesComplete, 
  detectCycle, 
  enrichTask, 
  isTaskBlocked, 
  getHigherPriorityEligibleBlockers,
  getNextEligibleTask,
  cascadeReopenDownstreamTasks
} = require('../utils/dependencyUtils');

/**
 * Get all tasks with optional filtering and role-based visibility:
 * - Admin: Can see all tasks in the system.
 * - Member: Can see ONLY tasks assigned to them.
 */
const getTasks = (req, res) => {
  try {
    const { priority, status, assignedTo, isBlocked, search } = req.query;

    let resultList = Array.from(tasks.values()).map(task => 
      enrichTask(task, tasks, users)
    );

    // 1. Role-Based Task Visibility Enforcement:
    // Members must not be able to see tasks assigned to other members.
    if (!req.isAdmin) {
      resultList = resultList.filter(t => t.assignedTo === req.user.id);
    }

    // 2. Filter by Priority
    if (priority && priority !== 'All') {
      resultList = resultList.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
    }

    // 3. Filter by Status
    if (status && status !== 'All') {
      resultList = resultList.filter(t => t.status.toLowerCase() === status.toLowerCase());
    }

    // 4. Filter by Assigned User (Admin can filter by user; Member is already constrained to themselves)
    if (assignedTo && assignedTo !== 'All') {
      resultList = resultList.filter(t => t.assignedTo === assignedTo);
    }

    // 5. Filter by Blocked Status
    if (isBlocked !== undefined && isBlocked !== 'All' && isBlocked !== '') {
      const showBlockedOnly = isBlocked === 'true' || isBlocked === '1';
      resultList = resultList.filter(t => t.isBlocked === showBlockedOnly);
    }

    // 6. Filter by Search Query
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      resultList = resultList.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sort by createdAt descending
    resultList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: resultList.length,
      data: resultList
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get single task by ID
 * Role Enforcement:
 * - Admin: Can view any task.
 * - Member: Cannot retrieve another member's tasks by modifying API request or task ID.
 */
const getTaskById = (req, res) => {
  try {
    const { id } = req.params;
    const task = tasks.get(id);

    if (!task) {
      return res.status(404).json({ success: false, message: `Task '${id}' not found.` });
    }

    // Strict role check for single task retrieval
    if (!req.isAdmin && task.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not authorized to view this task."
      });
    }

    res.json({ success: true, data: enrichTask(task, tasks, users) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get next recommended task to work on / complete based on priority order:
 * High -> Medium -> Low among ELIGIBLE (unblocked) tasks.
 * - Admin: Evaluates all eligible tasks across the system.
 * - Member: Evaluates next eligible task assigned to that member.
 */
const getNextEligible = (req, res) => {
  try {
    const targetUserId = req.isAdmin ? null : req.user.id;
    const nextTask = getNextEligibleTask(tasks, users, targetUserId);
    res.json({
      success: true,
      data: nextTask
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * View all tasks assigned to a specific user
 * Role Enforcement:
 * - Admin: Can view tasks for any user.
 * - Member: Can view only their own task list.
 */
const getTasksByUser = (req, res) => {
  try {
    const { userId } = req.params;

    if (!users.has(userId)) {
      return res.status(404).json({ success: false, message: `User '${userId}' not found.` });
    }

    // Member cannot view another member's user tasks list
    if (!req.isAdmin && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You cannot view tasks assigned to other members."
      });
    }

    const userTasks = Array.from(tasks.values())
      .filter(t => t.assignedTo === userId)
      .map(t => enrichTask(t, tasks, users));

    res.json({
      success: true,
      userId,
      count: userTasks.length,
      data: userTasks
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * View all blocked tasks
 * - Admin: all blocked tasks in system.
 * - Member: blocked tasks assigned to member.
 */
const getBlockedTasks = (req, res) => {
  try {
    let blockedTasks = Array.from(tasks.values())
      .map(t => enrichTask(t, tasks, users))
      .filter(t => t.isBlocked);

    if (!req.isAdmin) {
      blockedTasks = blockedTasks.filter(t => t.assignedTo === req.user.id);
    }

    res.json({
      success: true,
      count: blockedTasks.length,
      data: blockedTasks
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a new task
 * Role Enforcement:
 * - Admin: Can create tasks and assign them to any member.
 * - Member: Cannot assign tasks to other members.
 */
const createTask = (req, res) => {
  try {
    const { title, description, priority, status, assignedTo, dependencies } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Task title is required." });
    }

    const taskPriority = priority || 'Medium';
    const taskStatus = status || 'To Do';

    // WORKFLOW RULE: New tasks cannot be created directly as 'Done'
    if (taskStatus === 'Done') {
      return res.status(400).json({
        success: false,
        message: "Cannot create a new task directly as 'Done'. New tasks must start as 'To Do' or 'In Progress'."
      });
    }

    // Role Enforcement: Tasks can ONLY be created by an Admin
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only administrators can create tasks."
      });
    }

    const finalAssignedTo = assignedTo || null;
    
    // Sanitize and deduplicate dependencies, ensuring IDs exist in database
    const taskDependencies = Array.isArray(dependencies) 
      ? [...new Set(dependencies)].filter(depId => tasks.has(depId))
      : [];

    const newId = generateId('tsk');
    const now = new Date().toISOString();

    const newTask = {
      id: newId,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: taskPriority,
      status: taskStatus,
      assignedTo: finalAssignedTo,
      dependencies: taskDependencies,
      createdAt: now,
      updatedAt: now
    };

    tasks.set(newId, newTask);

    res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: enrichTask(newTask, tasks, users)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update an existing task
 * Enforces:
 * 1. Role-Based Access: Members cannot modify tasks belonging to other members
 * 2. Role-Based Reassignment: Members cannot change the assignee of a task
 * 3. Role-Based Task Completion: Only the assigned member can mark their task as Done
 * 4. Progression Rule: Cannot directly mark Done from 'To Do' (must be 'In Progress' first)
 * 5. Dependency Blocking Rule: All prerequisite dependencies must be Done
 * 6. Priority Precedence Rule: Higher priority ELIGIBLE tasks must be completed first
 * 7. Cycle Detection: Prevents circular dependency loops
 * 8. Cascade Reopen: Reopening a prerequisite reopens downstream completed tasks
 */
const updateTask = (req, res) => {
  try {
    const { id } = req.params;
    const existingTask = tasks.get(id);

    if (!existingTask) {
      return res.status(404).json({ success: false, message: `Task '${id}' not found.` });
    }

    const { title, description, priority, status, assignedTo, dependencies } = req.body;

    // 1. Role Check - Task Modification:
    // Members cannot modify tasks belonging to other members
    if (!req.isAdmin && existingTask.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You cannot modify tasks assigned to other members."
      });
    }

    // 2. Role Check - Task Reassignment:
    // Members cannot change the assignee of a task
    if (!req.isAdmin && assignedTo !== undefined && assignedTo !== existingTask.assignedTo) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Members cannot change the assignee of a task."
      });
    }

    const newStatus = status !== undefined ? status : existingTask.status;
    const newPriority = priority !== undefined ? priority : existingTask.priority;

    // Sanitize dependencies: eliminate self-reference, nonexistent IDs, and duplicates
    const newDependencies = dependencies !== undefined 
      ? (Array.isArray(dependencies) 
          ? [...new Set(dependencies)].filter(depId => depId !== id && tasks.has(depId)) 
          : []) 
      : existingTask.dependencies;

    // Dependency Cycle Check if dependencies are updated
    if (dependencies !== undefined) {
      const cycleCheck = detectCycle(id, newDependencies, tasks);
      if (cycleCheck.hasCycle) {
        return res.status(400).json({
          success: false,
          message: `Circular dependency error: Setting this dependency would create a loop in task dependencies!`
        });
      }
    }

    // 3. CRITICAL PROGRESSION RULE: Cannot mark Done directly from 'To Do'!
    // A task must first be moved to 'In Progress' before it can be completed.
    if (existingTask.status === 'To Do' && newStatus === 'Done') {
      return res.status(400).json({
        success: false,
        message: "Cannot mark task as 'Done' directly from 'To Do'. Task must be moved to 'In Progress' first."
      });
    }

    // 4. TASK COMPLETION PERMISSION:
    // When an Admin assigns a task to a specific member, another member cannot mark it as Done.
    // Member A cannot mark Member B's task as Done. Admin retains full visibility and management access.
    if (newStatus === 'Done') {
      if (!req.isAdmin && existingTask.assignedTo && existingTask.assignedTo !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Only the assigned member can mark this task as Done."
        });
      }
    }

    // 6. CRITICAL DEPENDENCY RULE: Mark task as complete ONLY when dependencies are complete!
    if (newStatus === 'Done') {
      const depCheck = checkDependenciesComplete(newDependencies, tasks);
      if (!depCheck.canComplete) {
        const blockingNames = depCheck.blockingTasks.map(t => `'${t.title}' (${t.status})`).join(', ');
        return res.status(400).json({
          success: false,
          message: `Cannot mark task as 'Done'. Uncompleted prerequisite dependencies remaining: ${blockingNames}`,
          blockingTasks: depCheck.blockingTasks
        });
      }
    }

    // 7. PRIORITY PRECEDENCE RULE: Higher-priority ELIGIBLE tasks must be completed first!
    if (newStatus === 'Done') {
      const taskForCheck = { ...existingTask, priority: newPriority, dependencies: newDependencies };
      const higherPriorityBlockers = getHigherPriorityEligibleBlockers(taskForCheck, tasks);

      if (higherPriorityBlockers.length > 0) {
        const names = higherPriorityBlockers.map(t => `'${t.title}' (${t.priority})`).join(', ');
        return res.status(400).json({
          success: false,
          message: `Cannot mark ${newPriority} priority task as 'Done'. High priority tasks must be completed first: ${names}`,
          higherPriorityBlockers
        });
      }
    }

    // 8. Cascade Reopen: If this task was 'Done' and is now reopened ('In Progress' or 'To Do'),
    // downstream tasks that were 'Done' must be reopened to maintain dependency integrity!
    let reopenedDownstream = [];
    if (existingTask.status === 'Done' && newStatus !== 'Done') {
      reopenedDownstream = cascadeReopenDownstreamTasks(id, tasks);
      if (reopenedDownstream.length > 0) {
        console.log(`[TaskController] Cascade reopened ${reopenedDownstream.length} downstream tasks because '${existingTask.title}' was reopened.`);
      }
    }

    // Update task properties
    const updatedTask = {
      ...existingTask,
      title: title !== undefined ? title.trim() : existingTask.title,
      description: description !== undefined ? description.trim() : existingTask.description,
      priority: newPriority,
      status: newStatus,
      assignedTo: req.isAdmin && assignedTo !== undefined ? assignedTo : existingTask.assignedTo,
      dependencies: newDependencies,
      updatedAt: new Date().toISOString()
    };

    tasks.set(id, updatedTask);

    res.json({
      success: true,
      message: reopenedDownstream.length > 0
        ? `Task updated. Note: Reopened ${reopenedDownstream.length} dependent task(s) to 'In Progress'.`
        : "Task updated successfully.",
      data: enrichTask(updatedTask, tasks, users),
      reopenedCount: reopenedDownstream.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete a task and clean up references from other tasks' dependency lists
 * Role Enforcement: Members cannot delete tasks belonging to other members.
 */
const deleteTask = (req, res) => {
  try {
    const { id } = req.params;
    const taskToDelete = tasks.get(id);

    if (!taskToDelete) {
      return res.status(404).json({ success: false, message: `Task '${id}' not found.` });
    }

    // Role check: Members cannot delete tasks assigned to others
    if (!req.isAdmin && taskToDelete.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You cannot delete tasks assigned to other members."
      });
    }

    tasks.delete(id);

    // Clean up references to this task from all other tasks' dependency lists
    for (const [tId, task] of tasks.entries()) {
      if (task.dependencies && task.dependencies.includes(id)) {
        task.dependencies = task.dependencies.filter(depId => depId !== id);
        task.updatedAt = new Date().toISOString();
        tasks.set(tId, task);
      }
    }

    res.json({
      success: true,
      message: `Task '${id}' deleted successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Dependency Graph structure for visual chart rendering
 */
const getDependencyGraph = (req, res) => {
  try {
    const nodes = [];
    const links = [];

    Array.from(tasks.values()).forEach(task => {
      const assignedUser = task.assignedTo ? users.get(task.assignedTo) : null;
      const isBlocked = isTaskBlocked(task, tasks);

      nodes.push({
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
        dependencies: task.dependencies || [],
        isBlocked,
        assignedTo: task.assignedTo,
        assigneeName: assignedUser ? assignedUser.name : 'Unassigned',
        assigneeAvatar: assignedUser ? assignedUser.avatarColor : '#6B7280'
      });

      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          if (tasks.has(depId)) {
            const prereqTask = tasks.get(depId);
            links.push({
              source: depId,
              target: task.id,
              sourceTitle: prereqTask ? prereqTask.title : depId,
              targetTitle: task.title,
              isPrereqDone: prereqTask ? prereqTask.status === 'Done' : false
            });
          }
        });
      }
    });

    res.json({
      success: true,
      data: { nodes, links }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Reset data store back to initial seed data
 */
const resetData = (req, res) => {
  try {
    seedInitialData();
    res.json({
      success: true,
      message: "Database reset to initial seed data successfully."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  getNextEligible,
  getTasksByUser,
  getBlockedTasks,
  createTask,
  updateTask,
  deleteTask,
  getDependencyGraph,
  resetData
};
