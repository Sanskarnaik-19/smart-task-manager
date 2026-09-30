'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Clock, Lock, Layers, Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function StatSummary() {
  const { tasks, users, setActiveTab, updateFilter } = useApp();
  const [collapsedMobile, setCollapsedMobile] = useState(false);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const blockedTasks = tasks.filter(t => t.isBlocked).length;

  return (
    <div className="stat-summary-wrapper">
      {/* Mobile Collapse Header Toggle */}
      <div className="mobile-stats-header">
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Overview Insights
        </span>
        <button 
          onClick={() => setCollapsedMobile(!collapsedMobile)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#818CF8', fontWeight: 600 }}
        >
          {collapsedMobile ? (
            <>Show Stats <ChevronDown size={14} /></>
          ) : (
            <>Hide Stats <ChevronUp size={14} /></>
          )}
        </button>
      </div>

      {!collapsedMobile && (
        <div className="stat-summary-grid">
          {/* Card 1: Total Tasks */}
          <div 
            className="glass-panel stat-card clickable"
            onClick={() => { setActiveTab('all'); updateFilter('status', 'All'); }}
            title="View all tasks"
          >
            <div>
              <div className="stat-title">Total Tasks</div>
              <div className="stat-value">{totalTasks}</div>
            </div>
            <div className="stat-icon-bg" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
              <Layers size={20} />
            </div>
          </div>

          {/* Card 2: In Progress */}
          <div 
            className="glass-panel stat-card clickable"
            onClick={() => { setActiveTab('all'); updateFilter('status', 'In Progress'); }}
            title="Filter by In Progress"
          >
            <div>
              <div className="stat-title">In Progress</div>
              <div className="stat-value" style={{ color: '#3B82F6' }}>{inProgressTasks}</div>
            </div>
            <div className="stat-icon-bg" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
              <Clock size={20} />
            </div>
          </div>

          {/* Card 3: Completed */}
          <div 
            className="glass-panel stat-card clickable"
            onClick={() => { setActiveTab('all'); updateFilter('status', 'Done'); }}
            title="Filter by Completed"
          >
            <div>
              <div className="stat-title">Completed</div>
              <div className="stat-value" style={{ color: '#10B981' }}>{doneTasks}</div>
            </div>
            <div className="stat-icon-bg" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>

          {/* Card 4: Blocked */}
          <div 
            className="glass-panel stat-card clickable"
            onClick={() => setActiveTab('blocked')}
            title="Jump to Blocked Tasks"
          >
            <div>
              <div className="stat-title">Blocked</div>
              <div className="stat-value" style={{ color: blockedTasks > 0 ? '#F43F5E' : '#9CA3AF' }}>
                {blockedTasks}
              </div>
            </div>
            <div className="stat-icon-bg" style={{ background: blockedTasks > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.05)', color: blockedTasks > 0 ? '#F43F5E' : '#9CA3AF' }}>
              <Lock size={20} />
            </div>
          </div>

          {/* Card 5: Team */}
          <div 
            className="glass-panel stat-card clickable team-stat-card"
            onClick={() => setActiveTab('users')}
            title="View Team Roster"
          >
            <div>
              <div className="stat-title">Team</div>
              <div className="stat-value">{users.length}</div>
            </div>
            <div className="stat-icon-bg" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' }}>
              <Users size={20} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
