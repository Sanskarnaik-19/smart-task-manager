'use client';

import React, { useState, useMemo } from 'react';
import TaskCard from './TaskCard';
import { useApp } from '../context/AppContext';
import { List, LayoutGrid, AlertCircle, Plus, Sparkles, Play, Check, Flame, Zap, Leaf } from 'lucide-react';

const PRIORITY_RANKS = { High: 3, Medium: 2, Low: 1 };

export default function TaskBoard({ tasksToDisplay, onEditTask, onOpenTaskModal }) {
  const { tasks, updateTask } = useApp();
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'
  const [actionLoading, setActionLoading] = useState(false);

  const todoTasks = tasksToDisplay.filter(t => t.status === 'To Do');
  const inProgressTasks = tasksToDisplay.filter(t => t.status === 'In Progress');
  const doneTasks = tasksToDisplay.filter(t => t.status === 'Done');

  // Compute the next eligible task across the system according to:
  // High -> Medium -> Low, respecting dependencies (only unblocked tasks)
  const nextEligibleTask = useMemo(() => {
    const eligible = tasks.filter(t => t.status !== 'Done' && !t.isBlocked);
    if (eligible.length === 0) return null;
    return [...eligible].sort((a, b) => {
      const pDiff = (PRIORITY_RANKS[b.priority] || 2) - (PRIORITY_RANKS[a.priority] || 2);
      if (pDiff !== 0) return pDiff;
      if (a.status === 'In Progress' && b.status === 'To Do') return -1;
      if (a.status === 'To Do' && b.status === 'In Progress') return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    })[0];
  }, [tasks]);

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
      <div className="glass-panel" style={{ margin: '0 2rem 2rem 2rem', padding: '3rem', textAlign: 'center' }}>
        <AlertCircle size={40} style={{ color: '#9CA3AF', margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>No tasks found</h3>
        <p style={{ color: '#9CA3AF', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          No tasks match your selected filters or criteria.
        </p>
        <button className="btn-primary" onClick={onOpenTaskModal} style={{ margin: '0 auto' }}>
          <Plus size={16} /> Create First Task
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* View Toggle Bar & Priority Quick Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 2rem 0.75rem 2rem' }}>
        <div className="nav-tabs">
          <button 
            className={`tab-btn ${viewMode === 'board' ? 'active' : ''}`}
            onClick={() => setViewMode('board')}
            style={{ padding: '0.4rem 0.8rem' }}
          >
            <LayoutGrid size={15} /> Board View
          </button>
          <button 
            className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            style={{ padding: '0.4rem 0.8rem' }}
          >
            <List size={15} /> List View
          </button>
        </div>
      </div>

      {/* Priority Selection Recommendation Banner */}
      {nextEligibleTask && (
        <div className="priority-queue-banner" style={{
          margin: '0 2rem 1.25rem 2rem',
          padding: '0.85rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.12) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.25)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818CF8'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A5B4FC' }}>
                  🎯 Next Priority Task to Handle
                </span>
                <span className={`priority-badge ${nextEligibleTask.priority.toLowerCase()}`} style={{ padding: '1px 6px', fontSize: '0.68rem' }}>
                  {getPriorityIcon(nextEligibleTask.priority)}
                  {nextEligibleTask.priority}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                  ({nextEligibleTask.status})
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F3F4F6' }}>
                {nextEligibleTask.title}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleNextTaskAction}
              disabled={actionLoading}
              className="btn-primary"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.82rem',
                background: nextEligibleTask.status === 'In Progress' 
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
              }}
            >
              {nextEligibleTask.status === 'To Do' ? (
                <>
                  <Play size={14} fill="currentColor" /> Start Task (Move to In Progress)
                </>
              ) : (
                <>
                  <Check size={14} /> Complete Task (Mark as Done)
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
          <div className="kanban-column">
            <div className="column-header">
              <div className="column-title">
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#64748B' }}></span>
                To Do
              </div>
              <span className="badge-count">{todoTasks.length}</span>
            </div>
            <div>
              {todoTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={onEditTask} 
                  isNextRecommended={task.id === nextEligibleTask?.id}
                />
              ))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="kanban-column">
            <div className="column-header">
              <div className="column-title">
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3B82F6' }}></span>
                In Progress
              </div>
              <span className="badge-count" style={{ background: 'rgba(59, 130, 246, 0.3)' }}>{inProgressTasks.length}</span>
            </div>
            <div>
              {inProgressTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={onEditTask} 
                  isNextRecommended={task.id === nextEligibleTask?.id}
                />
              ))}
            </div>
          </div>

          {/* Column 3: Done */}
          <div className="kanban-column">
            <div className="column-header">
              <div className="column-title">
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }}></span>
                Done
              </div>
              <span className="badge-count" style={{ background: 'rgba(16, 185, 129, 0.3)' }}>{doneTasks.length}</span>
            </div>
            <div>
              {doneTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={onEditTask} 
                  isNextRecommended={task.id === nextEligibleTask?.id}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div style={{ margin: '0 2rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
