'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Clock, Lock, Layers, Users } from 'lucide-react';

export default function StatSummary() {
  const { tasks, users } = useApp();

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const blockedTasks = tasks.filter(t => t.isBlocked).length;

  return (
    <div className="stat-summary-grid">
      <div className="glass-panel stat-card">
        <div>
          <div className="stat-title">Total Tasks</div>
          <div className="stat-value">{totalTasks}</div>
        </div>
        <div className="stat-icon-bg" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
          <Layers size={22} />
        </div>
      </div>

      <div className="glass-panel stat-card">
        <div>
          <div className="stat-title">Completed</div>
          <div className="stat-value" style={{ color: '#10B981' }}>{doneTasks}</div>
        </div>
        <div className="stat-icon-bg" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
          <CheckCircle2 size={22} />
        </div>
      </div>

      <div className="glass-panel stat-card">
        <div>
          <div className="stat-title">In Progress</div>
          <div className="stat-value" style={{ color: '#3B82F6' }}>{inProgressTasks}</div>
        </div>
        <div className="stat-icon-bg" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
          <Clock size={22} />
        </div>
      </div>

      <div className="glass-panel stat-card">
        <div>
          <div className="stat-title">Blocked Tasks</div>
          <div className="stat-value" style={{ color: blockedTasks > 0 ? '#F43F5E' : '#9CA3AF' }}>
            {blockedTasks}
          </div>
        </div>
        <div className="stat-icon-bg" style={{ background: blockedTasks > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.05)', color: blockedTasks > 0 ? '#F43F5E' : '#9CA3AF' }}>
          <Lock size={22} />
        </div>
      </div>

      <div className="glass-panel stat-card">
        <div>
          <div className="stat-title">Team Members</div>
          <div className="stat-value">{users.length}</div>
        </div>
        <div className="stat-icon-bg" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' }}>
          <Users size={22} />
        </div>
      </div>
    </div>
  );
}
