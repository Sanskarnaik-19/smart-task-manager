'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import StatSummary from '../components/StatSummary';
import FilterBar from '../components/FilterBar';
import TaskBoard from '../components/TaskBoard';
import BlockedTasksView from '../components/BlockedTasksView';
import DependencyGraphView from '../components/DependencyGraphView';
import UserManagementView from '../components/UserManagementView';
import TaskModal from '../components/TaskModal';
import UserModal from '../components/UserModal';
import LoginModal from '../components/LoginModal';

export default function Home() {
  const { tasks, filteredTasks, activeTab, currentUser, loading } = useApp();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const handleOpenCreateTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  // Compute tasks to display based on active tab
  let tasksToDisplay = filteredTasks;
  if (activeTab === 'my-tasks') {
    tasksToDisplay = filteredTasks.filter(t => t.assignedTo === currentUser?.id);
  } else if (activeTab === 'blocked') {
    tasksToDisplay = tasks.filter(t => t.isBlocked);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navigation & Action Bar */}
      <Header
        onOpenTaskModal={handleOpenCreateTask}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {/* Metric Summary Cards */}
        <StatSummary />

        {/* View Switcher Logic */}
        {activeTab === 'users' ? (
          <UserManagementView onOpenUserModal={() => setIsUserModalOpen(true)} />
        ) : activeTab === 'graph' ? (
          <DependencyGraphView />
        ) : activeTab === 'blocked' ? (
          <BlockedTasksView onEditTask={handleOpenEditTask} />
        ) : (
          <>
            {/* Filter & Search Controls */}
            <FilterBar />

            {/* Task Board / List */}
            {loading ? (
              <div style={{ textTransform: 'center', textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading state from Express server...</div>
              </div>
            ) : (
              <TaskBoard
                tasksToDisplay={tasksToDisplay}
                onEditTask={handleOpenEditTask}
                onOpenTaskModal={handleOpenCreateTask}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenRegister={() => setIsUserModalOpen(true)}
      />
    </div>
  );
}
