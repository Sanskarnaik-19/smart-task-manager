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
  LogIn,
  ShieldCheck,
  Sparkles
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

  const isAdmin = currentUser?.role === 'Admin';
  const myTaskCount = tasks.filter(t => t.assignedTo === currentUser?.id).length;
  const blockedCount = tasks.filter(t => t.isBlocked).length;

  return (
    <header className="header-container">
      {/* Brand Section */}
      <div className="brand-section">
        <div className="brand-logo">STM</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="brand-title">
            Smart Task Manager
          </div>
          <div className="mobile-only-role" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
              background: isAdmin ? 'rgba(236, 72, 153, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              color: isAdmin ? '#F472B6' : '#60A5FA',
              border: isAdmin ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)'
            }}>
              {isAdmin ? '👑 Admin' : `👤 ${currentUser?.name || 'Member'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs - Visible on Desktop & Tablets */}
      <nav className="nav-tabs desktop-nav-tabs">
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
          Blocked
          {blockedCount > 0 && <span className="badge-count danger">{blockedCount}</span>}
        </button>

        <button 
          className={`tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          <GitFork size={16} />
          Dependencies
        </button>

        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          Team ({users.length})
        </button>
      </nav>

      {/* User Session Switcher & Primary Action */}
      <div className="header-actions">
        {/* User Profile / Mock Auth Selector */}
        <div style={{ position: 'relative' }}>
          <div 
            className="user-profile-pill"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            title="Click to switch user or manage session"
          >
            {currentUser ? (
              <>
                <div 
                  className="avatar-circle" 
                  style={{ backgroundColor: currentUser.avatarColor || '#6366F1' }}
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-pill-details">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                      {currentUser.name}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: isAdmin ? 'rgba(236, 72, 153, 0.25)' : 'rgba(59, 130, 246, 0.25)',
                      color: isAdmin ? '#F472B6' : '#60A5FA',
                      border: isAdmin ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)'
                    }}>
                      {isAdmin ? '👑 Admin' : '👤 Member'}
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
            <ChevronDown size={14} style={{ color: '#9CA3AF', marginLeft: 2 }} />
          </div>

          {/* User Selector Dropdown Menu */}
          {userDropdownOpen && (
            <div 
              className="glass-panel user-dropdown-menu"
              style={{
                position: 'absolute',
                top: '115%',
                right: 0,
                width: 270,
                padding: '8px',
                zIndex: 100,
                boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ 
                fontSize: '0.7rem', 
                fontWeight: 800, 
                color: '#9CA3AF', 
                padding: '6px 8px', 
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Switch Role / User</span>
                <span style={{ color: '#818CF8' }}>Mock Auth</span>
              </div>
              
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {users.map(u => {
                  const isCurrent = currentUser?.id === u.id;
                  const isUserAdmin = u.role === 'Admin';
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        loginUser(u.id);
                        setUserDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isCurrent ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                        border: isCurrent ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
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
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                            {u.name} {isUserAdmin && '👑'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                            {isUserAdmin ? 'Admin (Can create & assign)' : 'Member (Assigned tasks)'}
                          </div>
                        </div>
                      </div>
                      {isCurrent && <Check size={14} style={{ color: '#6366F1' }} />}
                    </div>
                  );
                })}
              </div>

              {/* Action buttons inside dropdown */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button 
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onOpenLoginModal();
                  }}
                  className="dropdown-action-btn"
                >
                  <LogIn size={14} /> Log In with Username
                </button>

                <button 
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onOpenUserModal();
                  }}
                  className="dropdown-action-btn"
                >
                  <UserPlus size={14} /> Register New Team Member
                </button>

                <button 
                  onClick={() => {
                    setUserDropdownOpen(false);
                    resetDatabase();
                  }}
                  className="dropdown-action-btn reset"
                >
                  <RotateCcw size={14} /> Reset Sample Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Task Button: SHOWN ONLY FOR ADMIN */}
        {isAdmin ? (
          <button 
            className="btn-primary desktop-create-btn" 
            onClick={onOpenTaskModal}
            title="Create a new task and assign to team members"
          >
            <Plus size={18} />
            <span>Create Task</span>
          </button>
        ) : (
          <div className="member-indicator-badge desktop-only" title="Task creation is restricted to Administrators">
            <ShieldCheck size={14} />
            <span>Member Access</span>
          </div>
        )}
      </div>
    </header>
  );
}
