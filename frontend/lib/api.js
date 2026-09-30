/**
 * API Client for Smart Task Manager Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi(endpoint, options = {}) {
  try {
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('stm_current_user') : null;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(currentUserId ? { 'x-user-id': currentUserId } : {}),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error ${endpoint}]:`, error);
    throw error;
  }
}

// User & Auth API Calls
export const api = {
  // Users & Mock Auth
  getUsers: () => fetchApi('/users'),
  getUserById: (id) => fetchApi(`/users/${id}`),
  createUser: (userData) => fetchApi('/users', { method: 'POST', body: userData }),
  loginUser: (credentials) => fetchApi('/users/login', { method: 'POST', body: credentials }),

  // Tasks
  getTasks: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.priority && filters.priority !== 'All') params.append('priority', filters.priority);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.assignedTo && filters.assignedTo !== 'All') params.append('assignedTo', filters.assignedTo);
    if (filters.isBlocked !== undefined && filters.isBlocked !== 'All' && filters.isBlocked !== '') {
      params.append('isBlocked', filters.isBlocked);
    }
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString();
    return fetchApi(`/tasks${queryString ? `?${queryString}` : ''}`);
  },

  getTaskById: (id) => fetchApi(`/tasks/${id}`),
  getNextEligibleTask: () => fetchApi('/tasks/next-eligible'),
  getUserTasks: (userId) => fetchApi(`/tasks/user/${userId}`),
  getBlockedTasks: () => fetchApi('/tasks/blocked'),
  getDependencyGraph: () => fetchApi('/tasks/graph'),

  createTask: (taskData) => fetchApi('/tasks', { method: 'POST', body: taskData }),
  updateTask: (id, taskData) => fetchApi(`/tasks/${id}`, { method: 'PUT', body: taskData }),
  deleteTask: (id) => fetchApi(`/tasks/${id}`, { method: 'DELETE' }),

  resetDatabase: () => fetchApi('/reset', { method: 'POST' }),
};
