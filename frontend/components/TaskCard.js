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

  // Check if current user has permission to mark this task as Done:
  // When assigned to a member, another member cannot mark it as Done.
  const isAssignedToCurrentUser = !task.assignedTo || (currentUser && task.assignedTo === currentUser.id);
  const isMember = currentUser?.role === 'Member';
  const hasCompletionPermission = !isMember || isAssignedToCurrentUser;

  // Check if there are any strictly higher-priority tasks that are ELIGIBLE (unblocked) and incomplete
  // CRITICAL RULE:
  // "if a High-priority task is blocked because its prerequisite tasks are not Done,
  // select the next eligible task rather than breaking the dependency rules."
  const higherPriorityBlockers = useMemo(() => {
    return tasks.filter(t => {
      if (t.id === task.id || t.status === 'Done') return false;
      const otherRank = PRIORITY_RANKS[t.priority] || 2;
      if (otherRank <= currentRank) return false;

      // If that higher-priority task depends on this task, this task must complete first!
      if (t.dependencies && t.dependencies.includes(task.id)) return false;

      // If the higher-priority task is BLOCKED by its own prerequisites, it is NOT eligible!
      // Therefore, it does NOT prevent completing this task.
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
        <div style={{
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25))',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 8,
          padding: '4px 8px',
          marginBottom: 8,
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#A5B4FC',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <Sparkles size={12} style={{ color: '#818CF8' }} />
          <span>Priority Selection: Next Task to Handle</span>
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
          >
            <Edit3 size={15} />
          </button>
          <button 
            className="icon-btn danger" 
            onClick={() => deleteTask(task.id)}
            title="Delete Task"
          >
            <Trash2 size={15} />
          </button>
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
          <Lock size={16} className="shrink-0 text-rose-400" />
          <div>
            Blocked by {task.blockingTasks?.length || 1} incomplete prerequisite(s).
          </div>
        </div>
      )}

      {/* Higher Priority Pending Warning Banner */}
      {!task.isBlocked && hasHigherPriorityBlocker && task.status !== 'Done' && (
        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, padding: '6px 10px', fontSize: '0.74rem', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <AlertTriangle size={13} className="shrink-0" />
          <span>Complete higher-priority task first: <strong>{higherPriorityBlockers[0]?.title}</strong></span>
        </div>
      )}

      {/* Card Action Button Bar (Direct 1-Click Progression) */}
      <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {task.status === 'To Do' && (
          <button
            onClick={() => handleTransition('In Progress')}
            className="btn-primary"
            style={{ width: '100%', padding: '6px 10px', fontSize: '0.78rem', justifyContent: 'center', gap: 6 }}
          >
            <Play size={13} /> Start Task (Move to In Progress)
          </button>
        )}

        {task.status === 'In Progress' && (
          canMarkDone ? (
            <button
              onClick={() => handleTransition('Done')}
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                border: '1px solid #34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <Check size={14} /> Mark as Done
            </button>
          ) : (
            <div style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '0.74rem',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#9CA3AF',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5
            }}>
              {!hasCompletionPermission ? (
                <>
                  <Lock size={12} style={{ color: '#F43F5E' }} />
                  <span>Cannot mark Done (Assigned to {task.assignedUser?.name || 'another member'})</span>
                </>
              ) : task.isBlocked ? (
                <>
                  <Lock size={12} style={{ color: '#F43F5E' }} />
                  <span>Cannot mark Done (Prerequisites incomplete)</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={12} style={{ color: '#F59E0B' }} />
                  <span>Cannot mark Done (High-priority task pending)</span>
                </>
              )}
            </div>
          )
        )}

        {task.status === 'Done' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={14} /> Completed
            </span>
            <button
              onClick={() => handleTransition('In Progress')}
              className="btn-secondary"
              style={{ padding: '2px 8px', fontSize: '0.7rem' }}
              title="Reopen task back to In Progress"
            >
              <RotateCcw size={11} /> Reopen
            </button>
          </div>
        )}
      </div>

      {/* Card Footer: Assignee & Dropdown Selector */}
      <div className="task-card-footer" style={{ marginTop: '0.75rem' }}>
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
          className="select-input"
          style={{
            padding: '3px 6px',
            fontSize: '0.75rem',
            fontWeight: 700,
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
                ? '🔒 Done (Assigned to another member)'
                : isDirectFromTodo 
                  ? '🔒 Done (Move to In Progress first)' 
                  : task.isBlocked 
                    ? '🔒 Done (Prerequisites incomplete)' 
                    : hasHigherPriorityBlocker 
                      ? '🔒 Done (High priority pending)' 
                      : '✅ Done'}
          </option>
        </select>
      </div>
    </div>
  );
}
