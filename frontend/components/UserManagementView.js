'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, UserPlus, Mail, Briefcase } from 'lucide-react';

export default function UserManagementView({ onOpenUserModal }) {
  const { users, currentUser, loginUser } = useApp();

  return (
    <div className="view-container">
      {/* Header */}
      <div 
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: 10, borderRadius: 12, color: '#EC4899' }}>
            <Users size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
              Team Member Roster & Mock Authentication
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
              View user workload stats, assign tasks, or switch active session.
            </p>
          </div>
        </div>

        <button className="btn-primary" onClick={onOpenUserModal}>
          <UserPlus size={16} /> Register New User
        </button>
      </div>

      {/* User Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {users.map(user => {
          const isCurrent = currentUser?.id === user.id;

          return (
            <div 
              key={user.id} 
              className="glass-card" 
              style={{
                padding: '1.5rem',
                border: isCurrent ? '1px solid #6366F1' : undefined,
                boxShadow: isCurrent ? '0 0 20px rgba(99, 102, 241, 0.3)' : undefined
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div 
                    className="avatar-circle" 
                    style={{ backgroundColor: user.avatarColor, width: 44, height: 44, fontSize: '1.1rem' }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{user.name}</h3>
                    <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>@{user.username}</span>
                  </div>
                </div>

                {isCurrent ? (
                  <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818CF8', padding: '3px 8px', borderRadius: 12, fontWeight: 700, border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                    Active Session
                  </span>
                ) : (
                  <button 
                    className="btn-secondary" 
                    onClick={() => loginUser(user.id)}
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  >
                    Log in as
                  </button>
                )}
              </div>

              {/* User Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Briefcase size={14} style={{ color: '#818CF8' }} /> {user.role === 'Admin' ? '👑 Admin (Full Management)' : '👤 Member (Assigned Tasks Only)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} style={{ color: '#818CF8' }} /> {user.email}
                </div>
              </div>

              {/* Workload Stats */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Total</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{user.stats?.totalAssigned || 0}</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#34D399' }}>Done</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34D399' }}>{user.stats?.done || 0}</div>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#60A5FA' }}>In Progress</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60A5FA' }}>{user.stats?.inProgress || 0}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
