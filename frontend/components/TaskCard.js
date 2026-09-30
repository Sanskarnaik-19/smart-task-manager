'use client';

import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Edit3, 
  Trash2, 
  Link2, 
  Check, 
  Flame, 
  Zap, 
  Leaf, 
  Play, 
  RotateCcw, 
  Sparkles 
} from 'lucide-react';

const PRIORITY_RANKS = { High: 3, Medium: 2, Low: 1 };

export default function TaskCard({ task, onEdit, isNextRecommended = false }) {
  const { updateTask, deleteTask, tasks, currentUser } = useApp();

  const currentRank = PRIORITY_RANKS[task.priority] || 2;
  const isAdmin = currentUser?.role === 'Admin';

  // Check if current user has permission to mark this task as Done:
  // When assigned to a member, another member cannot mark it as Done.
  const isAssignedToCurrentUser = !task.assignedTo || (currentUser && task.assignedTo === currentUser.id);
  const isMember = currentUser?.role === 'Member';
  const hasCompletionPermission = !isMember || isAssignedToCurrentUser;

  // Check if there are any strictly higher-priority tasks that are ELIGIBLE (unblocked) and incomplete
  const higherPriorityBlockers = useMemo(() => {
    return tasks.filter(t => {
      if (t.id === task.id || t.status === 'Done') return false;
      const otherRank = PRIORITY_RANKS[t.priority] || 2;
      if (otherRank <= currentRank) return false;

      // If that higher-priority task depends on this task, this task must complete first!
      if (t.dependencies && t.dependencies.includes(task.id)) return false;

      // If the higher-priority task is BLOCKED by its own prerequisites, it is NOT eligible!
      return !t.isBlocked;
    });
  }, [tasks, task, currentRank]);

  const hasHigherPriorityBlocker = higherPriorityBlockers.length > 0;
  const isDirectFromTodo = task.status === 'To Do';

  // Can this task be marked as Done right now?
  const canMarkDone = task.status === 'In Progress' && !task.isBlocked && !hasHigherPriorityBlocker && hasCompletionPermission;

  // Quick Action Handler for 1-Click Status Transitions
  const handleTransition = async (targetStatus) => {
    try {
      await updateTask(task.id, { status: targetStatus });
    } catch (err) {
      // Toast displayed by AppContext
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High': return <Flame size={12} />;
      case 'Medium': return <Zap size={12} />;
      case 'Low': return <Leaf size={12} />;
      default: return null;
    }
  };

  return (
    <div 
      className={`glass-card task-card ${task.isBlocked ? 'blocked-border' : ''}`}
      style={{
        border: isNextRecommended ? '2px solid #6366F1' : undefined,
        boxShadow: isNextRecommended ? '0 0 20px rgba(99, 102, 241, 0.35)' : undefined
      }}
    >
      {/* Top Banner if this is the Next Recommended Task */}
      {isNextRecommended && task.status !== 'Done' && (
        <div className="next-recommended-badge">
          <Sparkles size={12} style={{ color: '#818CF8' }} />
          <span>Priority Selection: Next Task</span>
        </div>
      )}

      {/* Card Header: Priority & Action Icons */}
      <div className="task-card-header">
        <span className={`priority-badge ${task.priority.toLowerCase()}`}>
          {getPriorityIcon(task.priority)}
          {task.priority} Priority
        </span>

        <div className="card-actions">
          <button 
            className="icon-btn" 
            onClick={() => onEdit(task)}
            title="Edit Task"
            aria-label="Edit Task"
          >
            <Edit3 size={15} />
          </button>

          {(isAdmin || isAssignedToCurrentUser) && (
            <button 
              className="icon-btn danger" 
              onClick={() => deleteTask(task.id)}
              title="Delete Task"
              aria-label="Delete Task"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Task Title & Description */}
      <div>
        <h3 className="task-title">{task.title}</h3>
        {task.description && <p className="task-desc" style={{ marginTop: 6 }}>{task.description}</p>}
      </div>

      {/* Dependencies Badge List */}
      {task.dependencyDetails && task.dependencyDetails.length > 0 && (
        <div className="dependencies-section">
          <div className="dep-label">
            <Link2 size={12} />
            Prerequisites ({task.dependencyDetails.length}):
          </div>
          <div className="dep-pills-list">
            {task.dependencyDetails.map(dep => (
              <span key={dep.id} className={`dep-pill ${dep.isDone ? 'done' : 'pending'}`}>
                {dep.isDone ? <Check size={10} /> : <Lock size={10} />}
                {dep.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Blocked Warning Banner */}
      {task.isBlocked && (
        <div className="blocked-warning-box">
          <Lock size={15} className="shrink-0" />
          <div>
            Blocked: {task.blockingTasks?.length || 1} incomplete prerequisite(s)
          </div>
        </div>
      )}

      {/* Higher Priority Pending Warning Banner */}
      {!task.isBlocked && hasHigherPriorityBlocker && task.status !== 'Done' && (
        <div className="priority-warning-box">
          <AlertTriangle size={13} className="shrink-0" />
          <span>Complete higher-priority task first: <strong>{higherPriorityBlockers[0]?.title}</strong></span>
        </div>
      )}

      {/* Card Action Button Bar (Direct 1-Click Progression) */}
      <div className="task-card-action-bar">
        {task.status === 'To Do' && (
          <button
            onClick={() => handleTransition('In Progress')}
            className="btn-primary touch-action-btn"
          >
            <Play size={14} fill="currentColor" /> Start Task
          </button>
        )}

        {task.status === 'In Progress' && (
          canMarkDone ? (
            <button
              onClick={() => handleTransition('Done')}
              className="touch-action-btn done-action-btn"
            >
              <Check size={16} /> Mark as Done
            </button>
          ) : (
            <div className="blocked-action-indicator">
              {!hasCompletionPermission ? (
                <>
                  <Lock size={13} style={{ color: '#F43F5E' }} />
                  <span>Assigned to {task.assignedUser?.name || 'another member'}</span>
                </>
              ) : task.isBlocked ? (
                <>
                  <Lock size={13} style={{ color: '#F43F5E' }} />
                  <span>Prerequisites incomplete</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={13} style={{ color: '#F59E0B' }} />
                  <span>Higher priority task pending</span>
                </>
              )}
            </div>
          )
        )}

        {task.status === 'Done' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 size={15} /> Completed
            </span>
            <button
              onClick={() => handleTransition('In Progress')}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
              title="Reopen task back to In Progress"
            >
              <RotateCcw size={12} /> Reopen
            </button>
          </div>
        )}
      </div>

      {/* Card Footer: Assignee & Status Dropdown Selector */}
      <div className="task-card-footer">
        {/* Assignee */}
        <div className="assignee-info">
          {task.assignedUser ? (
            <>
              <div 
                className="avatar-circle" 
                style={{ backgroundColor: task.assignedUser.avatarColor, width: 22, height: 22, fontSize: '0.65rem' }}
              >
                {task.assignedUser.name.charAt(0)}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#E5E7EB', fontWeight: 600 }}>
                {task.assignedUser.name}
              </span>
            </>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontStyle: 'italic' }}>
              Unassigned
            </span>
          )}
        </div>

        {/* Status Dropdown Selector */}
        <select
          value={task.status}
          onChange={(e) => handleTransition(e.target.value)}
          className="select-input card-status-select"
          style={{
            borderColor: task.status === 'Done' ? 'rgba(16, 185, 129, 0.4)' : undefined,
            color: task.status === 'Done' ? '#34D399' : task.status === 'In Progress' ? '#60A5FA' : '#9CA3AF'
          }}
        >
          <option value="To Do">📋 To Do</option>
          <option value="In Progress">🚀 In Progress</option>
          <option value="Done" disabled={!canMarkDone && task.status !== 'Done'}>
            {task.status === 'Done' 
              ? '✅ Done' 
              : !hasCompletionPermission
                ? '🔒 Done (Other member task)'
                : isDirectFromTodo 
                  ? '🔒 Done (Move to In Progress)' 
                  : task.isBlocked 
                    ? '🔒 Done (Blocked)' 
                    : hasHigherPriorityBlocker 
                      ? '🔒 Done (Priority rule)' 
                      : '✅ Done'}
          </option>
        </select>
      </div>
    </div>
  );
}
