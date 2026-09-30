'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { X, Link2, AlertCircle, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, taskToEdit = null }) {
  const { tasks, users, createTask, updateTask, currentUser } = useApp();

  const isAdmin = currentUser?.role === 'Admin';
  const isMember = currentUser?.role === 'Member';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('To Do');
  const [assignedTo, setAssignedTo] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority || 'Medium');
      setStatus(taskToEdit.status || 'To Do');
      setAssignedTo(taskToEdit.assignedTo || '');
      setSelectedDependencies(taskToEdit.dependencies || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('To Do');
      setAssignedTo(users[0]?.id || '');
      setSelectedDependencies([]);
    }
    setErrorMsg('');
  }, [taskToEdit, users, isOpen]);

  // Check if any selected dependency is incomplete (not 'Done')
  const hasIncompleteDependencies = useMemo(() => {
    return selectedDependencies.some(depId => {
      const depTask = tasks.find(t => t.id === depId);
      return !depTask || depTask.status !== 'Done';
    });
  }, [selectedDependencies, tasks]);

  const PRIORITY_RANKS = { High: 3, Medium: 2, Low: 1 };

  // Priority check: Higher priority ELIGIBLE tasks must be completed first
  const higherPriorityBlockers = useMemo(() => {
    const currentRank = PRIORITY_RANKS[priority] || 2;
    return tasks.filter(t => {
      if (taskToEdit && t.id === taskToEdit.id) return false;
      if (t.status === 'Done') return false;
      const otherRank = PRIORITY_RANKS[t.priority] || 2;
      if (otherRank <= currentRank) return false;

      // If the higher-priority task depends on this task, this task must complete first!
      if (taskToEdit && t.dependencies && t.dependencies.includes(taskToEdit.id)) return false;

      // If higher-priority task is BLOCKED by its own prerequisites, it is ineligible and doesn't block!
      return !t.isBlocked;
    });
  }, [priority, tasks, taskToEdit]);

  const hasHigherPriorityBlocker = higherPriorityBlockers.length > 0;

  // Progression rule: Cannot jump directly from 'To Do' to 'Done'
  const isDirectFromTodo = Boolean(taskToEdit ? taskToEdit.status === 'To Do' : true);

  // Completion permission rule: Member can only mark task Done if assigned to them
  const hasCompletionPermission = !isMember || !taskToEdit || taskToEdit.assignedTo === currentUser?.id;

  // Is Done status disabled?
  const isDoneDisabled = hasIncompleteDependencies || isDirectFromTodo || hasHigherPriorityBlocker || !hasCompletionPermission;

  // Automatically reset status if Done is chosen while disabled
  useEffect(() => {
    if (isDoneDisabled && status === 'Done') {
      setStatus(taskToEdit?.status || 'To Do');
    }
  }, [isDoneDisabled, status, taskToEdit]);

  if (!isOpen) return null;

  // DFS Cycle Check Helper in UI: Checks if candidateTask depends on taskToEdit
  const wouldCauseCycle = (candidateTask) => {
    if (!taskToEdit) return false;
    if (candidateTask.id === taskToEdit.id) return true;

    const visited = new Set();
    const queue = [candidateTask.id];

    while (queue.length > 0) {
      const currId = queue.shift();
      if (currId === taskToEdit.id) return true;

      if (!visited.has(currId)) {
        visited.add(currId);
        const curr = tasks.find(t => t.id === currId);
        if (curr && curr.dependencies) {
          for (const nextDepId of curr.dependencies) {
            queue.push(nextDepId);
          }
        }
      }
    }

    return false;
  };

  const toggleDependency = (taskId) => {
    setSelectedDependencies(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Role Enforcement: Tasks can ONLY be created by Admin
    if (!taskToEdit && !isAdmin) {
      setErrorMsg("Access denied: Only administrators can create tasks.");
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Task Title is required.');
      return;
    }

    if (status === 'Done') {
      if (isDirectFromTodo) {
        setErrorMsg("Cannot mark task as 'Done' directly from 'To Do'. It must be in 'In Progress' first.");
        return;
      }
      if (hasHigherPriorityBlocker) {
        setErrorMsg(`Cannot mark ${priority.toLowerCase()} priority task as 'Done' while higher priority tasks are still incomplete.`);
        return;
      }
      if (hasIncompleteDependencies) {
        setErrorMsg("Cannot mark task as 'Done' while it has incomplete prerequisite dependencies.");
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        assignedTo: assignedTo || null,
        dependencies: selectedDependencies
      };

      if (taskToEdit) {
        await updateTask(taskToEdit.id, payload);
      } else {
        await createTask(payload);
      }

      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  // Available tasks to depend on (excluding current task if editing)
  const availableTasks = tasks.filter(t => !taskToEdit || t.id !== taskToEdit.id);

  // If non-admin tries to open create task modal
  const isCreateBlockedForMember = !taskToEdit && !isAdmin;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            {taskToEdit ? 'Edit Task' : 'Create New Task'}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {isCreateBlockedForMember && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 14px', borderRadius: 8, color: '#F87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={20} className="shrink-0" />
                <div>
                  <strong>Admin Only Action:</strong> Tasks can only be created by an Administrator. You are currently logged in as a Member.
                </div>
              </div>
            )}

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: 8, color: '#F87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Implement OAuth Authentication"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreateBlockedForMember}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Provide task scope and details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreateBlockedForMember}
              />
            </div>

            {/* Priority & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select 
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={isCreateBlockedForMember}
                >
                  <option value="Low">🌱 Low</option>
                  <option value="Medium">⚡ Medium</option>
                  <option value="High">🔥 High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isCreateBlockedForMember}
                >
                  <option value="To Do">📋 To Do</option>
                  <option value="In Progress">🚀 In Progress</option>
                  {taskToEdit && (
                    <option 
                      value="Done" 
                      disabled={isDoneDisabled && taskToEdit.status !== 'Done'}
                    >
                      {taskToEdit.status === 'Done' 
                        ? '✅ Done' 
                        : !hasCompletionPermission
                          ? '🔒 Done (Only assigned member can mark Done)'
                          : isDirectFromTodo
                            ? '🔒 Done (Move to In Progress first)'
                            : hasHigherPriorityBlocker
                              ? '🔒 Done (High priority tasks pending)'
                              : hasIncompleteDependencies
                                ? '🔒 Done (Prerequisites incomplete)'
                                : '✅ Done'}
                    </option>
                  )}
                </select>
              </div>
            </div>

            {/* Progression & Priority & Permission Rule Hints */}
            {!hasCompletionPermission && taskToEdit && (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 12px', borderRadius: 8, color: '#FCA5A5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} />
                <span>Permission Rule: Only the assigned member can mark this task as Done.</span>
              </div>
            )}

            {hasCompletionPermission && isDirectFromTodo && taskToEdit && (
              <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '8px 12px', borderRadius: 8, color: '#93C5FD', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} />
                <span>Workflow Rule: Tasks in <strong>&apos;To Do&apos;</strong> must be moved to <strong>&apos;In Progress&apos;</strong> before they can be marked as Done.</span>
              </div>
            )}

            {hasCompletionPermission && !isDirectFromTodo && hasHigherPriorityBlocker && (
              <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '8px 12px', borderRadius: 8, color: '#FBBF24', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} />
                <span>Priority Rule: Eligible higher-priority tasks must be completed before marking this {priority.toLowerCase()} priority task as Done.</span>
              </div>
            )}

            {hasCompletionPermission && !isDirectFromTodo && !hasHigherPriorityBlocker && hasIncompleteDependencies && (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 12px', borderRadius: 8, color: '#FCA5A5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} />
                <span>Dependency Rule: Cannot mark as Done until all selected prerequisite dependencies are completed.</span>
              </div>
            )}

            {/* Assignee - Admin Only can modify */}
            <div className="form-group">
              <label className="form-label">
                Assign To Team Member
                {!isAdmin && <span style={{ fontSize: '0.72rem', color: '#9CA3AF', marginLeft: 8 }}>(Admin Only)</span>}
              </label>
              <select
                className="form-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={!isAdmin || isCreateBlockedForMember}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'Admin' ? '👑 Admin' : '👤 Member'})
                  </option>
                ))}
              </select>
            </div>

            {/* Dependencies Checklist */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link2 size={14} /> Task Dependencies (Prerequisites that must complete first)
              </label>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--bg-card-border)', borderRadius: 8, padding: 10, maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {availableTasks.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#9CA3AF', fontStyle: 'italic' }}>
                    No other tasks exist yet to depend on.
                  </div>
                ) : (
                  availableTasks.map(t => {
                    const isChecked = selectedDependencies.includes(t.id);
                    const isCycleRisk = wouldCauseCycle(t);

                    return (
                      <label 
                        key={t.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 10, 
                          fontSize: '0.82rem', 
                          cursor: (isCycleRisk || isCreateBlockedForMember) ? 'not-allowed' : 'pointer',
                          padding: '6px 8px',
                          borderRadius: 6,
                          opacity: isCycleRisk ? 0.45 : 1,
                          background: isChecked ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                          border: isChecked ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isCycleRisk || isCreateBlockedForMember}
                          onChange={() => !isCycleRisk && toggleDependency(t.id)}
                        />
                        <span style={{ color: '#fff', fontWeight: 600 }}>{t.title}</span>

                        {isCycleRisk ? (
                          <span style={{ fontSize: '0.72rem', color: '#F87171', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <AlertTriangle size={11} /> Causes Loop
                          </span>
                        ) : (
                          <span style={{ 
                            fontSize: '0.72rem', 
                            color: t.status === 'Done' ? '#34D399' : '#9CA3AF', 
                            marginLeft: 'auto',
                            background: t.status === 'Done' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)',
                            padding: '2px 6px',
                            borderRadius: 4
                          }}>
                            {t.status === 'Done' ? '✅ Done' : `⏳ ${t.status}`}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={submitting || isCreateBlockedForMember}
            >
              {submitting ? 'Saving...' : taskToEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
