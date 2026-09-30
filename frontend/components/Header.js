'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  UserPlus, 
  RotateCcw, 
  Layers, 
  User, 
  Lock, 
  GitFork, 
  Users, 
  ChevronDown,
  Check,
  LogIn
} from 'lucide-react';

export default function Header({ onOpenTaskModal, onOpenUserModal, onOpenLoginModal }) {
  const { 
    currentUser, 
    users, 
    tasks, 
    activeTab, 
    setActiveTab, 
    loginUser, 
    resetDatabase 
  } = useApp();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Compute counts
  const myTaskCount = tasks.filter(t => t.assignedTo === currentUser?.id).length;
  const blockedCount = tasks.filter(t => t.isBlocked).length;

  return (
    <header className="header-container">
      {/* Brand Section */}
      <div className="brand-section">
        <div className="brand-logo">STM</div>
        <div>
          <div className="brand-title">
            Smart Task Manager
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="nav-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Layers size={16} />
          All Tasks
          <span className="badge-count">{tasks.length}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'my-tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-tasks')}
        >
          <User size={16} />
          My Tasks
          <span className="badge-count">{myTaskCount}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'blocked' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocked')}
        >
          <Lock size={16} />
          Blocked Tasks
          {blockedCount > 0 && <span className="badge-count danger">{blockedCount}</span>}
        </button>

        <button 
          className={`tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          <GitFork size={16} />
          Dependency Hub
        </button>

        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          Users
          <span className="badge-count">{users.length}</span>
        </button>
      </nav>

      {/* User Login Switcher & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Reset Database Button */}
        <button 
          className="btn-secondary" 
          onClick={resetDatabase}
          title="Reset tasks to sample state"
          style={{ padding: '0.6rem 0.8rem' }}
        >
          <RotateCcw size={16} />
        </button>

        {/* User Profile / Mock Auth Selector */}
        <div style={{ position: 'relative' }}>
          <div 
            className="user-profile-pill"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          >
            {currentUser ? (
              <>
                <div 
                  className="avatar-circle" 
                  style={{ backgroundColor: currentUser.avatarColor || '#6366F1' }}
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', paddingRight: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                      {currentUser.name}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: currentUser.role === 'Admin' ? 'rgba(236, 72, 153, 0.25)' : 'rgba(59, 130, 246, 0.25)',
                      color: currentUser.role === 'Admin' ? '#F472B6' : '#60A5FA',
                      border: currentUser.role === 'Admin' ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)'
                    }}>
                      {currentUser.role === 'Admin' ? '👑 Admin' : '👤 Member'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                    @{currentUser.username}
                  </span>
                </div>
              </>
            ) : (
              <span style={{ padding: '4px 8px', fontSize: '0.85rem', color: '#9CA3AF' }}>
                Select User
              </span>
            )}
            <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
          </div>

          {/* User Selector Dropdown Menu */}
          {userDropdownOpen && (
            <div 
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 250,
                padding: '8px',
                zIndex: 60,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', padding: '6px 8px', textTransform: 'uppercase' }}>
                Switch User (Mock Auth)
              </div>
              
              {users.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    loginUser(u.id);
                    setUserDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: currentUser?.id === u.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div 
                      className="avatar-circle" 
                      style={{ backgroundColor: u.avatarColor, width: 28, height: 28, fontSize: '0.75rem' }}
                    >
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{u.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>@{u.username} • {u.role === 'Admin' ? '👑 Admin' : '👤 Member'}</div>
                    </div>
                  </div>
                  {currentUser?.id === u.id && <Check size={14} style={{ color: '#6366F1' }} />}
                </div>
              ))}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button 
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onOpenLoginModal();
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '0.8rem',
                    color: '#818CF8',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <LogIn size={14} /> Log In with Username
                </button>

                <button 
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onOpenUserModal();
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '0.8rem',
                    color: '#6366F1',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <UserPlus size={14} /> Register New User
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <button className="btn-secondary" onClick={onOpenLoginModal}>
          <LogIn size={16} />
          Sign In
        </button>

        <button className="btn-secondary" onClick={onOpenUserModal}>
          <UserPlus size={16} />
          New User
        </button>

        <button className="btn-primary" onClick={onOpenTaskModal}>
          <Plus size={18} />
          Create Task
        </button>
      </div>
    </header>
  );
}
