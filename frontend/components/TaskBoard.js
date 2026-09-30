'use client';

import React, { useState, useMemo } from 'react';
import TaskCard from './TaskCard';
import { useApp } from '../context/AppContext';
import { List, LayoutGrid, AlertCircle, Plus, Sparkles, Play, Check, Flame, Zap, Leaf } from 'lucide-react';

const PRIORITY_RANKS = { High: 3, Medium: 2, Low: 1 };

export default function TaskBoard({ tasksToDisplay, onEditTask, onOpenTaskModal }) {
  const { tasks, updateTask, currentUser } = useApp();
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'
  const [mobileColumn, setMobileColumn] = useState('all'); // 'all', 'To Do', 'In Progress', 'Done'
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = currentUser?.role === 'Admin';

  const todoTasks = tasksToDisplay.filter(t => t.status === 'To Do');
  const inProgressTasks = tasksToDisplay.filter(t => t.status === 'In Progress');
  const doneTasks = tasksToDisplay.filter(t => t.status === 'Done');

  // Compute the next eligible task across the system according to:
  // High -> Medium -> Low, respecting dependencies (only unblocked tasks)
  const nextEligibleTask = useMemo(() => {
    // If current user is a Member, find their next eligible task
    const eligible = tasks.filter(t => {
      if (t.status === 'Done' || t.isBlocked) return false;
      if (!isAdmin && t.assignedTo !== currentUser?.id) return false;
      return true;
    });

    if (eligible.length === 0) return null;

    return [...eligible].sort((a, b) => {
      const pDiff = (PRIORITY_RANKS[b.priority] || 2) - (PRIORITY_RANKS[a.priority] || 2);
      if (pDiff !== 0) return pDiff;
      if (a.status === 'In Progress' && b.status === 'To Do') return -1;
      if (a.status === 'To Do' && b.status === 'In Progress') return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    })[0];
  }, [tasks, isAdmin, currentUser?.id]);

  const handleNextTaskAction = async () => {
    if (!nextEligibleTask || actionLoading) return;
    setActionLoading(true);
    try {
      if (nextEligibleTask.status === 'To Do') {
        await updateTask(nextEligibleTask.id, { status: 'In Progress' });
      } else if (nextEligibleTask.status === 'In Progress') {
        await updateTask(nextEligibleTask.id, { status: 'Done' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High': return <Flame size={13} style={{ color: '#F43F5E' }} />;
      case 'Medium': return <Zap size={13} style={{ color: '#F59E0B' }} />;
      case 'Low': return <Leaf size={13} style={{ color: '#10B981' }} />;
      default: return null;
    }
  };

  if (tasksToDisplay.length === 0) {
    return (
      <div className="glass-panel empty-state-box">
        <AlertCircle size={44} style={{ color: '#9CA3AF', margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>No tasks found</h3>
        <p style={{ color: '#9CA3AF', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {isAdmin 
            ? "No tasks match your selected filters. Create a new task to get started." 
            : "No tasks are assigned to you matching the criteria."}
        </p>
        {isAdmin && (
          <button className="btn-primary" onClick={onOpenTaskModal} style={{ margin: '0 auto' }}>
            <Plus size={16} /> Create Task
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="taskboard-container">
      {/* View Toggle Bar & Mobile Column Tabs */}
      <div className="board-controls-header">
        {/* Mobile Column Switcher (Visible only on phone/mobile screens) */}
        <div className="mobile-column-tabs">
          <button 
            className={`column-tab-btn ${mobileColumn === 'all' ? 'active' : ''}`}
            onClick={() => setMobileColumn('all')}
          >
            All <span className="tab-pill-count">{tasksToDisplay.length}</span>
          </button>
          <button 
            className={`column-tab-btn ${mobileColumn === 'To Do' ? 'active' : ''}`}
            onClick={() => setMobileColumn('To Do')}
          >
            📋 To Do <span className="tab-pill-count">{todoTasks.length}</span>
          </button>
          <button 
            className={`column-tab-btn ${mobileColumn === 'In Progress' ? 'active' : ''}`}
            onClick={() => setMobileColumn('In Progress')}
          >
            🚀 In Progress <span className="tab-pill-count">{inProgressTasks.length}</span>
          </button>
          <button 
            className={`column-tab-btn ${mobileColumn === 'Done' ? 'active' : ''}`}
            onClick={() => setMobileColumn('Done')}
          >
            ✅ Done <span className="tab-pill-count">{doneTasks.length}</span>
          </button>
        </div>

        {/* View Mode Toggle: Board vs List */}
        <div className="nav-tabs view-mode-tabs">
          <button 
            className={`tab-btn ${viewMode === 'board' ? 'active' : ''}`}
            onClick={() => setViewMode('board')}
            title="Kanban Board View"
          >
            <LayoutGrid size={15} /> <span className="desktop-text">Board</span>
          </button>
          <button 
            className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List size={15} /> <span className="desktop-text">List</span>
          </button>
        </div>
      </div>

      {/* Priority Selection Recommendation Banner */}
      {nextEligibleTask && (
        <div className="priority-queue-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
            <div className="priority-banner-icon">
              <Sparkles size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: 2 }}>
                <span className="priority-banner-tag">
                  🎯 Next Priority
                </span>
                <span className={`priority-badge ${nextEligibleTask.priority.toLowerCase()}`} style={{ padding: '1px 6px', fontSize: '0.68rem' }}>
                  {getPriorityIcon(nextEligibleTask.priority)}
                  {nextEligibleTask.priority}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                  ({nextEligibleTask.status})
                </span>
              </div>
              <div className="priority-banner-title">
                {nextEligibleTask.title}
              </div>
            </div>
          </div>

          <div className="priority-banner-actions">
            <button
              onClick={handleNextTaskAction}
              disabled={actionLoading}
              className="btn-primary priority-action-btn"
              style={{
                background: nextEligibleTask.status === 'In Progress' 
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
              }}
            >
              {nextEligibleTask.status === 'To Do' ? (
                <>
                  <Play size={14} fill="currentColor" /> Start Task
                </>
              ) : (
                <>
                  <Check size={14} /> Complete Task
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {viewMode === 'board' ? (
        /* Kanban Board Columns */
        <div className="kanban-grid">
          {/* Column 1: To Do */}
          {(mobileColumn === 'all' || mobileColumn === 'To Do') && (
            <div className="kanban-column">
              <div className="column-header">
                <div className="column-title">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#64748B' }}></span>
                  To Do
                </div>
                <span className="badge-count">{todoTasks.length}</span>
              </div>
              <div className="column-tasks-list">
                {todoTasks.length === 0 ? (
                  <div className="column-empty-placeholder">No tasks to do</div>
                ) : (
                  todoTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={onEditTask} 
                      isNextRecommended={task.id === nextEligibleTask?.id}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Column 2: In Progress */}
          {(mobileColumn === 'all' || mobileColumn === 'In Progress') && (
            <div className="kanban-column">
              <div className="column-header">
                <div className="column-title">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3B82F6' }}></span>
                  In Progress
                </div>
                <span className="badge-count" style={{ background: 'rgba(59, 130, 246, 0.3)' }}>{inProgressTasks.length}</span>
              </div>
              <div className="column-tasks-list">
                {inProgressTasks.length === 0 ? (
                  <div className="column-empty-placeholder">No tasks in progress</div>
                ) : (
                  inProgressTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={onEditTask} 
                      isNextRecommended={task.id === nextEligibleTask?.id}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Column 3: Done */}
          {(mobileColumn === 'all' || mobileColumn === 'Done') && (
            <div className="kanban-column">
              <div className="column-header">
                <div className="column-title">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }}></span>
                  Done
                </div>
                <span className="badge-count" style={{ background: 'rgba(16, 185, 129, 0.3)' }}>{doneTasks.length}</span>
              </div>
              <div className="column-tasks-list">
                {doneTasks.length === 0 ? (
                  <div className="column-empty-placeholder">No completed tasks</div>
                ) : (
                  doneTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={onEditTask} 
                      isNextRecommended={task.id === nextEligibleTask?.id}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="tasks-list-view">
          {tasksToDisplay.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={onEditTask} 
              isNextRecommended={task.id === nextEligibleTask?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
