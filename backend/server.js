/**
 * Smart Task Manager - Express Server Entrypoint
 */

const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const { resetData } = require('./controllers/taskController');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend client
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.post('/api/reset', resetData);

// Root Welcome / Status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Smart Task Manager Backend API is running.',
    frontendUrl: 'http://localhost:3000',
    endpoints: {
      health: '/api/health',
      tasks: '/api/tasks',
      users: '/api/users'
    }
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Smart Task Manager API',
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Smart Task Manager Express Server running on port ${PORT}`);
  console.log(`👉 API Endpoints: http://localhost:${PORT}/api/tasks`);
  console.log(`=======================================================`);
});
