'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, Filter, X, ShieldAlert } from 'lucide-react';

export default function FilterBar() {
  const { filters, updateFilter, resetFilters, users } = useApp();

  const isFiltered = 
    filters.priority !== 'All' || 
    filters.status !== 'All' || 
    filters.assignedTo !== 'All' || 
    filters.isBlocked !== 'All' || 
    filters.search !== '';

  return (
    <div className="glass-panel filter-bar">
      {/* Search Input */}
      <div className="search-wrapper">
        <Search className="search-icon" size={16} />
        <input
          type="text"
          className="search-input"
          placeholder="Search tasks by title or description..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
        {filters.search && (
          <button 
            onClick={() => updateFilter('search', '')}
            style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="filter-group">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9CA3AF', fontSize: '0.85rem', fontWeight: 600 }}>
          <Filter size={15} />
          Filters:
        </div>

        {/* Priority Filter */}
        <select
          className="select-input"
          value={filters.priority}
          onChange={(e) => updateFilter('priority', e.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="High">🔥 High Priority</option>
          <option value="Medium">⚡ Medium Priority</option>
          <option value="Low">🌱 Low Priority</option>
        </select>

        {/* Status Filter */}
        <select
          className="select-input"
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="To Do">📋 To Do</option>
          <option value="In Progress">🚀 In Progress</option>
          <option value="Done">✅ Done</option>
        </select>

        {/* Assignee Filter */}
        <select
          className="select-input"
          value={filters.assignedTo}
          onChange={(e) => updateFilter('assignedTo', e.target.value)}
        >
          <option value="All">All Assignees</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              👤 {u.name}
            </option>
          ))}
        </select>

        {/* Blocked Filter */}
        <select
          className="select-input"
          value={filters.isBlocked}
          onChange={(e) => updateFilter('isBlocked', e.target.value)}
          style={{
            borderColor: filters.isBlocked === 'true' ? 'rgba(244, 63, 94, 0.5)' : undefined,
            color: filters.isBlocked === 'true' ? '#FDA4AF' : undefined
          }}
        >
          <option value="All">All Dependency States</option>
          <option value="true">🔒 Blocked Tasks Only</option>
          <option value="false">🔓 Ready / Unblocked Tasks</option>
        </select>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button className="btn-secondary" onClick={resetFilters} style={{ padding: '0.55rem 0.85rem', fontSize: '0.8rem' }}>
            <X size={14} /> Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
