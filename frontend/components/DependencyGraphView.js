'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { 
  GitFork, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  Check, 
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  Link2,
  Unlink,
  Play,
  Flame,
  Zap,
  Leaf,
  ChevronRight,
  Eye,
  AlertCircle,
  X
} from 'lucide-react';

export default function DependencyGraphView() {
  const { tasks, updateTask } = useApp();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [activeSubView, setActiveSubView] = useState('pipeline'); // 'pipeline', 'matrix', 'linker'
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Linker state
  const [linkerSource, setLinkerSource] = useState('');
  const [linkerTarget, setLinkerTarget] = useState('');
  const [linkerError, setLinkerError] = useState('');
  const [linkingAction, setLinkingAction] = useState(false);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const res = await api.getDependencyGraph();
      if (res.success) {
        setGraphData(res.data);
      }
    } catch (err) {
      console.error("Failed to load graph data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [tasks]);

  // Compute Topological Tiers (Execution Waves)
  // Tier 1: Tasks with 0 dependencies
  // Tier 2: Tasks that only depend on Tier 1
  // Tier 3: Tasks that depend on Tier 2
  // Tier 4+: Remaining tasks
  const tieredTasks = useMemo(() => {
    if (!graphData.nodes || graphData.nodes.length === 0) return [];

    const tierMap = new Map();
    const taskMap = new Map();
    graphData.nodes.forEach(n => taskMap.set(n.id, n));

    // Helper to calculate depth
    function getDepth(taskId, visited = new Set()) {
      if (visited.has(taskId)) return 0;
      visited.add(taskId);

      const prereqs = graphData.links.filter(l => l.target === taskId);
      if (prereqs.length === 0) return 1;

      let maxPrereqDepth = 0;
      for (const p of prereqs) {
        maxPrereqDepth = Math.max(maxPrereqDepth, getDepth(p.source, new Set(visited)));
      }
      return maxPrereqDepth + 1;
    }

    const tiers = [[], [], [], []];

    graphData.nodes.forEach(node => {
      const depth = getDepth(node.id);
      const tierIndex = Math.min(depth - 1, 3);
      if (!tiers[tierIndex]) tiers[tierIndex] = [];
      tiers[tierIndex].push(node);
    });

    return tiers.filter(t => t.length > 0);
  }, [graphData]);

  // Primary Bottleneck: Which incomplete task blocks the most downstream tasks?
  const primaryBottleneck = useMemo(() => {
    if (!graphData.nodes || !graphData.links) return null;

    let maxBlocks = 0;
    let bottleneckTask = null;

    graphData.nodes.forEach(node => {
      if (node.status !== 'Done') {
        const downstreamBlocks = graphData.links.filter(l => l.source === node.id).length;
        if (downstreamBlocks > maxBlocks) {
          maxBlocks = downstreamBlocks;
          bottleneckTask = { ...node, downstreamCount: downstreamBlocks };
        }
      }
    });

    return bottleneckTask;
  }, [graphData]);

  // Selected Task Inspector Details
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, tasks]);

  // Handle Quick Status Action
  const handleQuickStatus = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      await loadGraph();
    } catch (err) {
      // Error handled by AppContext toast
    }
  };

  // Handle Adding Dependency Link
  const handleAddDependency = async (e) => {
    e.preventDefault();
    setLinkerError('');

    if (!linkerSource || !linkerTarget) {
      setLinkerError('Please select both a Dependent Task and a Prerequisite Task.');
      return;
    }

    if (linkerSource === linkerTarget) {
      setLinkerError('A task cannot depend on itself.');
      return;
    }

    const targetTask = tasks.find(t => t.id === linkerTarget);
    if (!targetTask) return;

    const existingDeps = targetTask.dependencies || [];
    if (existingDeps.includes(linkerSource)) {
      setLinkerError('This dependency connection already exists.');
      return;
    }

    try {
      setLinkingAction(true);
      await updateTask(linkerTarget, {
        dependencies: [...existingDeps, linkerSource]
      });
      setLinkerSource('');
      setLinkerTarget('');
      await loadGraph();
    } catch (err) {
      setLinkerError(err.message || 'Failed to add dependency link.');
    } finally {
      setLinkingAction(false);
    }
  };

  // Handle Removing Dependency Link
  const handleRemoveDependency = async (targetId, prereqId) => {
    const targetTask = tasks.find(t => t.id === targetId);
    if (!targetTask) return;

    try {
      setLinkingAction(true);
      await updateTask(targetId, {
        dependencies: (targetTask.dependencies || []).filter(id => id !== prereqId)
      });
      await loadGraph();
    } catch (err) {
      console.error(err);
    } finally {
      setLinkingAction(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return <span style={{ color: '#EF4444', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Flame size={12} /> High</span>;
      case 'Medium':
        return <span style={{ color: '#F59E0B', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Zap size={12} /> Med</span>;
      case 'Low':
        return <span style={{ color: '#10B981', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Leaf size={12} /> Low</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ margin: '0 2rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. TOP HEADER & METRIC OVERVIEW */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', padding: 12, borderRadius: 14, color: '#fff', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}>
            <GitFork size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              Task Dependency & Topology Hub
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: 2 }}>
              Interactive Directed Acyclic Graph (DAG), critical path visualizer, and dependency orchestrator.
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(15, 23, 42, 0.6)', padding: 4, borderRadius: 10, border: '1px solid var(--bg-card-border)' }}>
          <button
            onClick={() => setActiveSubView('pipeline')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeSubView === 'pipeline' ? 'var(--primary)' : 'transparent',
              color: activeSubView === 'pipeline' ? '#fff' : '#9CA3AF',
              transition: 'all 0.15s ease'
            }}
          >
            Pipeline Stages
          </button>
          <button
            onClick={() => setActiveSubView('matrix')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeSubView === 'matrix' ? 'var(--primary)' : 'transparent',
              color: activeSubView === 'matrix' ? '#fff' : '#9CA3AF',
              transition: 'all 0.15s ease'
            }}
          >
            Matrix & Topology
          </button>
          <button
            onClick={() => setActiveSubView('linker')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeSubView === 'linker' ? 'var(--primary)' : 'transparent',
              color: activeSubView === 'linker' ? '#fff' : '#9CA3AF',
              transition: 'all 0.15s ease'
            }}
          >
            Manage Links
          </button>
        </div>
      </div>

      {/* 2. CRITICAL BOTTLENECK & HEALTH BANNER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Metric 1: Total Dependencies */}
        <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: 10, borderRadius: 10, color: '#818CF8' }}>
            <Link2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>Active Dependency Links</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{graphData.links?.length || 0} connections</div>
          </div>
        </div>

        {/* Metric 2: Blocked Tasks */}
        <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: 10, borderRadius: 10, color: '#F43F5E' }}>
            <Lock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>Blocked Tasks</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FDA4AF' }}>
              {graphData.nodes?.filter(n => n.isBlocked).length || 0} waiting on upstream
            </div>
          </div>
        </div>

        {/* Metric 3: Critical Bottleneck Alert */}
        <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid #F59E0B' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: 10, borderRadius: 10, color: '#F59E0B' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 700 }}>Primary Bottleneck</div>
            {primaryBottleneck ? (
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                {primaryBottleneck.title} <span style={{ color: '#F59E0B' }}>(Blocks {primaryBottleneck.downstreamCount} tasks)</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#34D399', fontWeight: 600 }}>No bottlenecks! Workflow clear.</div>
            )}
          </div>
        </div>
      </div>

      {/* 3. SUB-VIEW CONTENT */}
      {activeSubView === 'pipeline' && (
        /* ================= SUB-VIEW 1: PIPELINE STAGES (TIERED DAG) ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>
              Tasks are organized into <strong>Execution Stages</strong> based on prerequisite depth. Complete earlier stages to unlock later stages.
            </div>
            <button 
              onClick={() => setFilterBlockedOnly(!filterBlockedOnly)}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', background: filterBlockedOnly ? 'rgba(244, 63, 94, 0.2)' : undefined }}
            >
              <Filter size={13} /> {filterBlockedOnly ? 'Showing Blocked Only' : 'Filter: All Tasks'}
            </button>
          </div>

          {/* Tiered Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tieredTasks.length || 1}, minmax(280px, 1fr))`, gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            {tieredTasks.map((tier, tierIdx) => {
              const stageNames = [
                'Stage 1: Foundation (Zero Prereqs)',
                'Stage 2: Core Work (Depends on Stage 1)',
                'Stage 3: Integration & Testing',
                'Stage 4: Final Delivery'
              ];

              const filteredNodes = filterBlockedOnly ? tier.filter(n => n.isBlocked) : tier;

              return (
                <div 
                  key={tierIdx} 
                  className="glass-panel" 
                  style={{ 
                    padding: '1.25rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem',
                    background: 'rgba(15, 23, 42, 0.65)'
                  }}
                >
                  {/* Stage Header */}
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818CF8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {stageNames[tierIdx] || `Stage ${tierIdx + 1}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: 2 }}>
                      {tier.length} tasks in this stage
                    </div>
                  </div>

                  {/* Tasks in this Stage */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {filteredNodes.map(node => {
                      const isSelected = selectedTaskId === node.id;
                      const prereqs = graphData.links.filter(l => l.target === node.id);
                      const downstream = graphData.links.filter(l => l.source === node.id);

                      return (
                        <div
                          key={node.id}
                          className="glass-card"
                          onClick={() => setSelectedTaskId(node.id)}
                          style={{
                            padding: '1rem',
                            cursor: 'pointer',
                            border: isSelected 
                              ? '2px solid #6366F1' 
                              : node.isBlocked 
                                ? '1px solid rgba(244, 63, 94, 0.5)' 
                                : undefined,
                            boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.3)' : undefined,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* Card Top: Priority & Status */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            {getPriorityBadge(node.priority)}

                            <span 
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 10,
                                background: node.status === 'Done' 
                                  ? 'rgba(16, 185, 129, 0.2)' 
                                  : node.isBlocked 
                                    ? 'rgba(244, 63, 94, 0.2)' 
                                    : 'rgba(59, 130, 246, 0.2)',
                                color: node.status === 'Done' 
                                  ? '#34D399' 
                                  : node.isBlocked 
                                    ? '#F43F5E' 
                                    : '#60A5FA'
                              }}
                            >
                              {node.isBlocked ? '🔒 Blocked' : node.status}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>
                            {node.title}
                          </h4>

                          {/* Assignee */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#9CA3AF', marginBottom: 8 }}>
                            <div className="avatar-circle" style={{ backgroundColor: node.assigneeAvatar, width: 18, height: 18, fontSize: '0.6rem' }}>
                              {node.assigneeName.charAt(0)}
                            </div>
                            <span>{node.assigneeName}</span>
                          </div>

                          {/* Dependency Summary Chips */}
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9CA3AF' }}>
                            <span>
                              Prereqs: <strong style={{ color: prereqs.length > 0 ? '#38BDF8' : '#9CA3AF' }}>{prereqs.length}</strong>
                            </span>
                            <span>
                              Unlocks: <strong style={{ color: downstream.length > 0 ? '#F43F5E' : '#9CA3AF' }}>{downstream.length}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubView === 'matrix' && (
        /* ================= SUB-VIEW 2: TOPOLOGY MATRIX TABLE ================= */
        <div className="glass-panel" style={{ padding: '1.25rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}>
                <th style={{ padding: '10px 12px' }}>Task</th>
                <th style={{ padding: '10px 12px' }}>Priority</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Prerequisites (Inbound)</th>
                <th style={{ padding: '10px 12px' }}>Blocks (Downstream)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {graphData.nodes.map(node => {
                const prereqs = graphData.links.filter(l => l.target === node.id);
                const downstream = graphData.links.filter(l => l.source === node.id);

                return (
                  <tr 
                    key={node.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: selectedTaskId === node.id ? 'rgba(99, 102, 241, 0.12)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: '0.72rem' }}>#{node.id}</span>
                        {node.title}
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      {getPriorityBadge(node.priority)}
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <span 
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 8,
                          background: node.status === 'Done' ? 'rgba(16, 185, 129, 0.18)' : node.isBlocked ? 'rgba(244, 63, 94, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                          color: node.status === 'Done' ? '#34D399' : node.isBlocked ? '#FDA4AF' : '#93C5FD'
                        }}
                      >
                        {node.isBlocked ? '🔒 Blocked' : node.status}
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      {prereqs.length === 0 ? (
                        <span style={{ color: '#34D399', fontSize: '0.75rem' }}>Standalone</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {prereqs.map(p => (
                            <span 
                              key={p.source}
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: p.isPrereqDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                                color: p.isPrereqDone ? '#34D399' : '#FCA5A5',
                                border: p.isPrereqDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)'
                              }}
                            >
                              {p.isPrereqDone ? '✓ ' : '🔒 '} {p.sourceTitle || p.source}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      {downstream.length === 0 ? (
                        <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>None</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {downstream.map(d => (
                            <span 
                              key={d.target}
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#93C5FD',
                                border: '1px solid rgba(59, 130, 246, 0.3)'
                              }}
                            >
                              ➔ {d.targetTitle || d.target}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => setSelectedTaskId(node.id)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeSubView === 'linker' && (
        /* ================= SUB-VIEW 3: QUICK PREREQUISITE LINKER ================= */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Form to Add New Dependency Link */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link2 size={18} style={{ color: '#6366F1' }} /> Create Prerequisite Link
            </h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              Define which task must be completed before another task can begin.
            </p>

            {linkerError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 12px', borderRadius: 8, color: '#F87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <AlertCircle size={14} /> {linkerError}
              </div>
            )}

            <form onSubmit={handleAddDependency} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Dependent Task (Will be blocked)</label>
                <select 
                  className="form-select"
                  value={linkerTarget}
                  onChange={(e) => setLinkerTarget(e.target.value)}
                  required
                >
                  <option value="">Select target task...</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Prerequisite Task (Must be done first)</label>
                <select 
                  className="form-select"
                  value={linkerSource}
                  onChange={(e) => setLinkerSource(e.target.value)}
                  required
                >
                  <option value="">Select prerequisite task...</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.status})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary" disabled={linkingAction} style={{ marginTop: '0.5rem' }}>
                <Link2 size={16} /> {linkingAction ? 'Linking...' : 'Connect Dependency'}
              </button>
            </form>
          </div>

          {/* Active Links Roster with Unlink Buttons */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              Existing Dependency Connections ({graphData.links?.length || 0})
            </h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              Click unlink to disconnect dependencies and remove blocking rules.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {graphData.links?.length === 0 ? (
                <div style={{ color: '#9CA3AF', fontSize: '0.85rem', fontStyle: 'italic' }}>No dependency links defined yet.</div>
              ) : (
                graphData.links.map(l => (
                  <div
                    key={`${l.source}->${l.target}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 8,
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <span style={{ color: l.isPrereqDone ? '#34D399' : '#FBBF24', fontWeight: 600 }}>
                        {l.sourceTitle}
                      </span>
                      <ArrowRight size={14} style={{ color: '#6366F1', flexShrink: 0 }} />
                      <span style={{ color: '#fff', fontWeight: 600 }}>
                        {l.targetTitle}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveDependency(l.target, l.source)}
                      disabled={linkingAction}
                      className="icon-btn danger"
                      title="Remove this dependency link"
                      style={{ padding: 4 }}
                    >
                      <Unlink size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SLIDE-OUT / POPUP TASK INSPECTOR MODAL */}
      {selectedTask && (
        <div className="modal-backdrop" onClick={() => setSelectedTaskId(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            {/* Header */}
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontFamily: 'monospace' }}>#{selectedTask.id}</div>
                <div className="modal-title" style={{ fontSize: '1.15rem' }}>{selectedTask.title}</div>
              </div>
              <button className="icon-btn" onClick={() => setSelectedTaskId(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ gap: '1rem' }}>
              {selectedTask.description && (
                <p style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                  {selectedTask.description}
                </p>
              )}

              {/* Status and Priority Pill Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span 
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 12,
                    background: selectedTask.status === 'Done' ? 'rgba(16, 185, 129, 0.2)' : selectedTask.isBlocked ? 'rgba(244, 63, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: selectedTask.status === 'Done' ? '#34D399' : selectedTask.isBlocked ? '#F43F5E' : '#60A5FA'
                  }}
                >
                  {selectedTask.isBlocked ? '🔒 Blocked' : selectedTask.status}
                </span>

                <span className={`priority-badge ${selectedTask.priority?.toLowerCase()}`}>
                  {selectedTask.priority} Priority
                </span>

                {selectedTask.assignedUser && (
                  <span style={{ fontSize: '0.78rem', color: '#9CA3AF', marginLeft: 'auto' }}>
                    👤 {selectedTask.assignedUser.name}
                  </span>
                )}
              </div>

              {/* Prerequisite Breakdown */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: 6 }}>
                  Prerequisites Required to Unlock:
                </div>
                {selectedTask.dependencyDetails?.length === 0 ? (
                  <div style={{ color: '#34D399', fontSize: '0.78rem' }}>None — this is a standalone foundation task!</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {selectedTask.dependencyDetails?.map(dep => (
                      <div key={dep.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#fff' }}>• {dep.title}</span>
                        <span style={{ color: dep.isDone ? '#34D399' : '#F59E0B' }}>
                          {dep.isDone ? '✅ Completed' : `⏳ ${dep.status}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Progression Controls */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: 8 }}>
                  Quick Workflow Action:
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {selectedTask.status === 'To Do' && (
                    <button
                      onClick={() => handleQuickStatus(selectedTask.id, 'In Progress')}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
                    >
                      <Play size={14} /> Start Task (Move to In Progress)
                    </button>
                  )}

                  {selectedTask.status === 'In Progress' && (
                    <button
                      onClick={() => handleQuickStatus(selectedTask.id, 'Done')}
                      disabled={selectedTask.isBlocked}
                      className="btn-primary"
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '0.8rem', 
                        width: '100%', 
                        justifyContent: 'center',
                        background: selectedTask.isBlocked ? '#475569' : '#059669',
                        borderColor: selectedTask.isBlocked ? '#64748B' : '#10B981'
                      }}
                    >
                      {selectedTask.isBlocked ? <Lock size={14} /> : <Check size={14} />}
                      {selectedTask.isBlocked ? 'Cannot Complete (Prerequisites incomplete)' : 'Mark as Completed'}
                    </button>
                  )}

                  {selectedTask.status === 'Done' && (
                    <button
                      onClick={() => handleQuickStatus(selectedTask.id, 'In Progress')}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
                    >
                      <RefreshCw size={14} /> Reopen Task (Cascade to dependents)
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedTaskId(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
