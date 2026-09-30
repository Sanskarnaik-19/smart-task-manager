/**
 * Dependency & Priority Utilities for Smart Task Manager
 * Handles blocking rules, dependency status checks, cycle detection,
 * data enrichment, and priority-based task eligibility.
 */

// Priority weighting: High > Medium > Low
const PRIORITY_WEIGHTS = {
  High: 3,
  Medium: 2,
  Low: 1
};

/**
 * Checks if all prerequisites (dependencies) for a target task are completed ('Done').
 * 
 * @param {Array<string>} dependencyIds - List of task IDs this task depends on
 * @param {Map<string, Object>} tasksMap - In-memory tasks map
 * @returns {Object} { canComplete: boolean, blockingTasks: Array<{id, title, status}> }
 */
function checkDependenciesComplete(dependencyIds, tasksMap) {
  if (!dependencyIds || !Array.isArray(dependencyIds) || dependencyIds.length === 0) {
    return { canComplete: true, blockingTasks: [] };
  }

  const blockingTasks = [];

  for (const depId of dependencyIds) {
    const depTask = tasksMap.get(depId);
    // If dependency task exists and is not marked 'Done', it blocks completion
    if (depTask && depTask.status !== 'Done') {
      blockingTasks.push({
        id: depTask.id,
        title: depTask.title,
        status: depTask.status
      });
    }
  }

  return {
    canComplete: blockingTasks.length === 0,
    blockingTasks
  };
}

/**
 * Detects if adding proposed dependencies to a task would introduce a directed dependency cycle.
 * Uses Depth First Search (DFS) traversal.
 * 
 * @param {string|null} targetTaskId - The ID of the task being updated or created
 * @param {Array<string>} proposedDependencies - Array of task IDs targetTaskId wants to depend on
 * @param {Map<string, Object>} tasksMap - In-memory tasks map
 * @returns {Object} { hasCycle: boolean, cyclePath: Array<string> }
 */
function detectCycle(targetTaskId, proposedDependencies, tasksMap) {
  if (!proposedDependencies || proposedDependencies.length === 0) {
    return { hasCycle: false, cyclePath: [] };
  }

  // Self-dependency check
  if (targetTaskId && proposedDependencies.includes(targetTaskId)) {
    return {
      hasCycle: true,
      cyclePath: [targetTaskId, targetTaskId]
    };
  }

  // If creating a brand new task (no targetTaskId yet), check if proposed dependencies themselves have any cycles
  if (!targetTaskId) {
    return { hasCycle: false, cyclePath: [] };
  }

  // Traverse downstream from each proposed dependency to see if targetTaskId is reachable
  for (const startDepId of proposedDependencies) {
    const visited = new Set();
    const stack = [startDepId];

    while (stack.length > 0) {
      const currentId = stack.pop();

      if (currentId === targetTaskId) {
        return {
          hasCycle: true,
          cyclePath: [targetTaskId, startDepId, targetTaskId]
        };
      }

      if (!visited.has(currentId)) {
        visited.add(currentId);
        const currentTask = tasksMap.get(currentId);

        if (currentTask && currentTask.dependencies) {
          for (const nextDepId of currentTask.dependencies) {
            if (!visited.has(nextDepId)) {
              stack.push(nextDepId);
            }
          }
        }
      }
    }
  }

  return { hasCycle: false, cyclePath: [] };
}

/**
 * Helper to check if a task is currently blocked by uncompleted dependencies.
 * A task is blocked ONLY IF it is NOT 'Done' and has incomplete prerequisites.
 * Tasks that are already 'Done' are completed and cannot be blocked.
 * 
 * @param {Object} task - Task object
 * @param {Map<string, Object>} tasksMap - In-memory tasks map
 * @returns {boolean}
 */
function isTaskBlocked(task, tasksMap) {
  if (!task || task.status === 'Done') return false;
  if (!task.dependencies || task.dependencies.length === 0) return false;

  return task.dependencies.some(depId => {
    const depTask = tasksMap.get(depId);
    return depTask && depTask.status !== 'Done';
  });
}

/**
 * Checks if a task is eligible to be worked on or completed.
 * A task is eligible if:
 * 1. It is unfinished ('status !== Done')
 * 2. It is NOT blocked by dependencies (all its prerequisites are 'Done')
 * 
 * @param {Object} task - Task object
 * @param {Map<string, Object>} tasksMap - In-memory tasks map
 * @returns {boolean}
 */
function isTaskEligible(task, tasksMap) {
  if (!task || task.status === 'Done') return false;
  return !isTaskBlocked(task, tasksMap);
}

/**
 * Checks if there are any higher priority tasks that are ELIGIBLE to be worked on / completed.
 * 
 * CRITICAL RULE:
 * If a High-priority task is blocked because its prerequisite tasks are not Done,
 * it is INELIGIBLE and does NOT block lower-priority eligible tasks!
 * 
 * @param {Object} task - Target task to evaluate
 * @param {Map<string, Object>} tasksMap - In-memory tasks map
 * @returns {Array<Object>} List of higher-priority tasks that are eligible and pending
 */
function getHigherPriorityEligibleBlockers(task, tasksMap) {
  const currentWeight = PRIORITY_WEIGHTS[task.priority] || 2;
  const blockers = [];

  for (const [tId, t] of tasksMap.entries()) {
    if (tId === task.id) continue;
    if (t.status === 'Done') continue;

    const otherWeight = PRIORITY_WEIGHTS[t.priority] || 2;

    // Only strictly higher priority tasks can take precedence
    if (otherWeight > currentWeight) {
      // If the higher priority task depends on this task, this task must complete first!
      if (t.dependencies && t.dependencies.includes(task.id)) {
        continue;
      }

      // If the higher-priority task is BLOCKED by dependencies, it cannot be worked on,
      // so it does NOT block lower-priority eligible tasks!
      if (isTaskEligible(t, tasksMap)) {
        blockers.push({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status
        });
      }
    }
  }

  return blockers;
}

/**
 * Select the next task to work on or complete according to priority order:
 * High -> Medium -> Low among ELIGIBLE (unblocked) tasks.
 * 
 * @param {Map<string, Object>} tasksMap - In-memory tasks map
 * @param {Map<string, Object>} usersMap - In-memory users map
 * @returns {Object|null} The highest-priority eligible task
 */
function getNextEligibleTask(tasksMap, usersMap = null, targetUserId = null) {
  let eligibleTasks = Array.from(tasksMap.values()).filter(t => isTaskEligible(t, tasksMap));

  if (targetUserId) {
    eligibleTasks = eligibleTasks.filter(t => t.assignedTo === targetUserId);
  }

  if (eligibleTasks.length === 0) return null;

  // Sort by priority weight descending (High: 3, Medium: 2, Low: 1),
  // then status ('In Progress' before 'To Do'), then createdAt ascending
  eligibleTasks.sort((a, b) => {
    const weightA = PRIORITY_WEIGHTS[a.priority] || 2;
    const weightB = PRIORITY_WEIGHTS[b.priority] || 2;
    if (weightB !== weightA) return weightB - weightA;

    // Prioritize In Progress over To Do
    if (a.status === 'In Progress' && b.status !== 'In Progress') return -1;
    if (b.status === 'In Progress' && a.status !== 'In Progress') return 1;

    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const nextTask = eligibleTasks[0];
  return usersMap ? enrichTask(nextTask, tasksMap, usersMap) : nextTask;
}

/**
 * Cascading Reopen: When a task changes status from 'Done' to 'To Do' or 'In Progress',
 * any downstream tasks that depend on it that were marked 'Done' must be reopened
 * to maintain strict dependency integrity.
 * 
 * @param {string} reopenedTaskId - ID of the prerequisite task that was reopened
 * @param {Map<string, Object>} tasksMap - In-memory tasks map
 * @returns {Array<Object>} List of affected downstream tasks that were reopened
 */
function cascadeReopenDownstreamTasks(reopenedTaskId, tasksMap) {
  const affectedTasks = [];

  function checkDownstream(currentTaskId) {
    for (const [tId, task] of tasksMap.entries()) {
      if (task.dependencies && task.dependencies.includes(currentTaskId)) {
        if (task.status === 'Done') {
          task.status = 'In Progress';
          task.updatedAt = new Date().toISOString();
          tasksMap.set(tId, task);
          affectedTasks.push(task);
          // Recursively cascade downstream
          checkDownstream(tId);
        }
      }
    }
  }

  checkDownstream(reopenedTaskId);
  return affectedTasks;
}

/**
 * Enriches a task object with user details, dependency objects, and blocked status for API responses
 */
function enrichTask(task, tasksMap, usersMap) {
  const assignedUser = task.assignedTo ? usersMap.get(task.assignedTo) || null : null;

  // Filter out any stale/deleted dependency references
  const validDependencies = (task.dependencies || []).filter(depId => tasksMap.has(depId));

  const dependencyDetails = validDependencies.map(depId => {
    const depTask = tasksMap.get(depId);
    return {
      id: depTask.id,
      title: depTask.title,
      status: depTask.status,
      priority: depTask.priority,
      isDone: depTask.status === 'Done'
    };
  });

  const depCheck = checkDependenciesComplete(validDependencies, tasksMap);
  // A task is blocked if it is NOT 'Done' and its prerequisites are not complete
  const blocked = task.status !== 'Done' && !depCheck.canComplete;

  // Check if higher-priority eligible tasks exist
  const higherPriorityBlockers = getHigherPriorityEligibleBlockers(task, tasksMap);

  return {
    ...task,
    dependencies: validDependencies,
    assignedUser,
    dependencyDetails,
    isBlocked: blocked,
    blockingTasks: blocked ? depCheck.blockingTasks : [],
    isEligible: !blocked && task.status !== 'Done',
    higherPriorityBlockers
  };
}

module.exports = {
  PRIORITY_WEIGHTS,
  checkDependenciesComplete,
  detectCycle,
  isTaskBlocked,
  isTaskEligible,
  getHigherPriorityEligibleBlockers,
  getNextEligibleTask,
  cascadeReopenDownstreamTasks,
  enrichTask
};
