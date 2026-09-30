const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/taskController');

// Enforce authentication & role context on all task endpoints
router.use(authenticateUser);

// Task Action Routes
router.get('/', getTasks);
router.get('/next-eligible', getNextEligible);
router.get('/blocked', getBlockedTasks);
router.get('/graph', getDependencyGraph);
router.get('/user/:userId', getTasksByUser);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
