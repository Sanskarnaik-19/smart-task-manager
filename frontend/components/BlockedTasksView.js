'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import TaskCard from './TaskCard';
import { ShieldAlert, Lock, CheckCircle2, Check } from 'lucide-react';

export default function BlockedTasksView({ onEditTask }) {
  const { tasks, updateTask } = useApp();

  const blockedTasks = tasks.filter(t => t.isBlocked);

  if (blockedTasks.length === 0) {
    return (
      <div className="glass-panel" style={{ margin: '0 2rem 2rem 2rem', padding: '3rem', textAlign: 'center' }}>
        <CheckCircle2 size={48} style={{ color: '#10B981', margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>No Blocked Tasks!</h3>
        <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
          All task dependencies are satisfied. Everyone on the team can proceed smoothly!
        </p>
      </div>
    );
  }

  return (
    <div style={{ margin: '0 2rem 2rem 2rem' }}>
      {/* Banner */}
      <div 
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          borderLeft: '4px solid #F43F5E',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <div style={{ background: 'rgba(244, 63, 94, 0.2)', padding: '10px', borderRadius: '12px', color: '#F43F5E' }}>
          <Lock size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>
            {blockedTasks.length} Task(s) Blocked (Cannot be marked as Done yet)
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: 2 }}>
            These tasks have prerequisite dependencies that must be completed before they can be marked as &apos;Done&apos;.
          </p>
        </div>
      </div>

      {/* Blocked Tasks Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {blockedTasks.map(task => (
          <div key={task.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <TaskCard task={task} onEdit={onEditTask} />

            {/* Detailed Prerequisite Breakdown */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FDA4AF', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={14} /> Unresolved Dependencies blocking this task:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {task.blockingTasks?.map(bt => {
                  const fullDepTask = tasks.find(t => t.id === bt.id);
                  const isDepAlsoBlocked = fullDepTask && fullDepTask.isBlocked;

                  return (
                    <div 
                      key={bt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '6px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span style={{ color: '#E5E7EB', fontWeight: 600 }}>{bt.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.72rem', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: 4 }}>
                          {bt.status}
                        </span>

                        {fullDepTask && (
                          isDepAlsoBlocked ? (
                            <span 
                              style={{ 
                                fontSize: '0.7rem', 
                                color: '#F87171', 
                                background: 'rgba(239, 68, 68, 0.15)', 
                                padding: '3px 8px', 
                                borderRadius: 4,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                              title="This prerequisite is waiting on its own dependencies first"
                            >
                              <Lock size={10} /> Also Blocked
                            </span>
                          ) : (
                            <button
                              onClick={() => updateTask(fullDepTask.id, { status: 'Done' })}
                              className="btn-primary"
                              style={{ 
                                padding: '3px 8px', 
                                fontSize: '0.72rem', 
                                background: '#059669', 
                                borderColor: '#10B981',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                              title="Mark this prerequisite as Done to help unblock this task"
                            >
                              <Check size={11} /> Mark Done
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
