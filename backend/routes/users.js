const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  createUser, 
  loginUser
} = require('../controllers/userController');

// User Action & Mock Authentication Routes
router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.post('/login', loginUser);

module.exports = router;
