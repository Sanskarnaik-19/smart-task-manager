'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../lib/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my-tasks', 'blocked', 'graph', 'users'
  const [filters, setFilters] = useState({
    priority: 'All',
    status: 'All',
    assignedTo: 'All',
    isBlocked: 'All',
    search: '',
  });
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    try {
      const res = await api.getUsers();
      if (res.success) {
        setUsers(res.data);
        if (res.data.length > 0) {
          const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('stm_current_user') : null;
          const found = res.data.find(u => u.id === storedUserId) || res.data[0];
          setCurrentUser(found);
          if (typeof window !== 'undefined') {
            localStorage.setItem('stm_current_user', found.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }, []);

  // Fetch tasks for the current authenticated user context from backend
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getTasks({});
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
      addToast(err.message || "Failed to load tasks from backend", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Initial Load
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reload tasks whenever current user changes
  useEffect(() => {
    if (currentUser?.id) {
      loadTasks();
    }
  }, [currentUser?.id, loadTasks]);

  // Compute filtered tasks on client from full tasks array
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // 1. Filter by Priority
    if (filters.priority && filters.priority !== 'All') {
      result = result.filter(t => t.priority.toLowerCase() === filters.priority.toLowerCase());
    }

    // 2. Filter by Status
    if (filters.status && filters.status !== 'All') {
      result = result.filter(t => t.status.toLowerCase() === filters.status.toLowerCase());
    }

    // 3. Filter by Assigned User
    if (filters.assignedTo && filters.assignedTo !== 'All') {
      result = result.filter(t => t.assignedTo === filters.assignedTo);
    }

    // 4. Filter by Blocked Status
    if (filters.isBlocked && filters.isBlocked !== 'All') {
      const showBlockedOnly = filters.isBlocked === 'true';
      result = result.filter(t => t.isBlocked === showBlockedOnly);
    }

    // 5. Filter by Search Query
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [tasks, filters]);

  // Login handler
  const loginUser = async (userOrId) => {
    try {
      let targetUser = typeof userOrId === 'string' ? users.find(u => u.id === userOrId) : userOrId;
      if (targetUser) {
        setCurrentUser(targetUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('stm_current_user', targetUser.id);
        }
        addToast(`Logged in as ${targetUser.name}`, "success");
      }
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // Create User
  const createUser = async (userData) => {
    try {
      const res = await api.createUser(userData);
      if (res.success && res.data) {
        addToast(`User '${res.data.name}' created successfully!`, "success");
        await loadUsers();
        return res.data;
      }
    } catch (err) {
      addToast(err.message, "error");
      throw err;
    }
  };

  // Create Task
  const createTask = async (taskData) => {
    try {
      const res = await api.createTask(taskData);
      if (res.success) {
        addToast(`Task '${res.data.title}' created!`, "success");
        await loadTasks();
        await loadUsers();
        return res.data;
      }
    } catch (err) {
      addToast(err.message, "error");
      throw err;
    }
  };

  // Update Task
  const updateTask = async (id, taskData) => {
    try {
      const res = await api.updateTask(id, taskData);
      if (res.success) {
        addToast(res.message || "Task updated successfully", "success");
        await loadTasks();
        await loadUsers();
        return res.data;
      }
    } catch (err) {
      addToast(err.message, "error");
      throw err;
    }
  };

  // Delete Task
  const deleteTask = async (id) => {
    try {
      const res = await api.deleteTask(id);
      if (res.success) {
        addToast(`Task deleted`, "info");
        await loadTasks();
        await loadUsers();
      }
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // Reset DB
  const resetDatabase = async () => {
    try {
      const res = await api.resetDatabase();
      if (res.success) {
        addToast("Database reset to sample state", "success");
        await loadUsers();
        await loadTasks();
      }
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // Quick filter helpers
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      priority: 'All',
      status: 'All',
      assignedTo: 'All',
      isBlocked: 'All',
      search: '',
    });
  };

  return (
    <AppContext.Provider value={{
      users,
      tasks,
      filteredTasks,
      currentUser,
      activeTab,
      setActiveTab,
      filters,
      updateFilter,
      resetFilters,
      loading,
      toasts,
      addToast,
      removeToast,
      loginUser,
      createUser,
      createTask,
      updateTask,
      deleteTask,
      resetDatabase,
      refreshData: () => { loadUsers(); loadTasks(); }
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
