'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { Layers, User, Lock, GitFork, Users, Plus } from 'lucide-react';

export default function MobileBottomNav({ onOpenCreateTask }) {
  const { activeTab, setActiveTab, tasks, users, currentUser } = useApp();

  const isAdmin = currentUser?.role === 'Admin';
  const myTaskCount = tasks.filter(t => t.assignedTo === currentUser?.id).length;
  const blockedCount = tasks.filter(t => t.isBlocked).length;

  return (
    <>
      {/* Floating Action Button (FAB) - ADMIN ONLY */}
      {isAdmin && (
        <button
          className="mobile-fab"
          onClick={onOpenCreateTask}
          aria-label="Create Task"
          title="Create New Task (Admin Only)"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <div className="mobile-nav-icon-wrapper">
            <Layers size={20} />
            <span className="mobile-nav-badge">{tasks.length}</span>
          </div>
          <span>Tasks</span>
        </button>

        <button
          className={`mobile-nav-item ${activeTab === 'my-tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-tasks')}
        >
          <div className="mobile-nav-icon-wrapper">
            <User size={20} />
            {myTaskCount > 0 && <span className="mobile-nav-badge">{myTaskCount}</span>}
          </div>
          <span>Mine</span>
        </button>

        <button
          className={`mobile-nav-item ${activeTab === 'blocked' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocked')}
        >
          <div className="mobile-nav-icon-wrapper">
            <Lock size={20} />
            {blockedCount > 0 && <span className="mobile-nav-badge danger">{blockedCount}</span>}
          </div>
          <span>Blocked</span>
        </button>

        <button
          className={`mobile-nav-item ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          <div className="mobile-nav-icon-wrapper">
            <GitFork size={20} />
          </div>
          <span>Graph</span>
        </button>

        <button
          className={`mobile-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <div className="mobile-nav-icon-wrapper">
            <Users size={20} />
            <span className="mobile-nav-badge">{users.length}</span>
          </div>
          <span>Team</span>
        </button>
      </nav>
    </>
  );
}
