'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Filter, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

export default function FilterBar() {
  const { filters, updateFilter, resetFilters, users } = useApp();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const isFiltered = 
    filters.priority !== 'All' || 
    filters.status !== 'All' || 
    filters.assignedTo !== 'All' || 
    filters.isBlocked !== 'All' || 
    filters.search !== '';

  const activeFilterCount = [
    filters.priority !== 'All',
    filters.status !== 'All',
    filters.assignedTo !== 'All',
    filters.isBlocked !== 'All'
  ].filter(Boolean).length;

  return (
    <div className="filter-bar-container">
      <div className="glass-panel filter-bar">
        {/* Search Input Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', flexWrap: 'wrap' }}>
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks..."
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

          {/* Toggle Advanced Filters Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`btn-secondary filter-toggle-btn ${activeFilterCount > 0 ? 'has-active' : ''}`}
            style={{ padding: '0.6rem 0.9rem', fontSize: '0.82rem' }}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="badge-count" style={{ background: '#6366F1', fontSize: '0.7rem' }}>
                {activeFilterCount}
              </span>
            )}
            {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isFiltered && (
            <button 
              className="btn-secondary" 
              onClick={resetFilters} 
              style={{ padding: '0.6rem 0.9rem', fontSize: '0.8rem', color: '#FDA4AF' }}
              title="Reset all filters"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Quick Filter Chips (One-Tap on Mobile & Desktop) */}
        <div className="filter-chips-row">
          <button
            className={`chip-btn ${filters.priority === 'All' && filters.isBlocked === 'All' ? 'active' : ''}`}
            onClick={() => { updateFilter('priority', 'All'); updateFilter('isBlocked', 'All'); }}
          >
            All
          </button>
          <button
            className={`chip-btn ${filters.priority === 'High' ? 'active' : ''}`}
            onClick={() => updateFilter('priority', filters.priority === 'High' ? 'All' : 'High')}
          >
            🔥 High
          </button>
          <button
            className={`chip-btn ${filters.priority === 'Medium' ? 'active' : ''}`}
            onClick={() => updateFilter('priority', filters.priority === 'Medium' ? 'All' : 'Medium')}
          >
            ⚡ Medium
          </button>
          <button
            className={`chip-btn ${filters.isBlocked === 'false' ? 'active' : ''}`}
            onClick={() => updateFilter('isBlocked', filters.isBlocked === 'false' ? 'All' : 'false')}
          >
            🔓 Ready
          </button>
          <button
            className={`chip-btn danger ${filters.isBlocked === 'true' ? 'active' : ''}`}
            onClick={() => updateFilter('isBlocked', filters.isBlocked === 'true' ? 'All' : 'true')}
          >
            🚫 Blocked
          </button>
        </div>

        {/* Expandable Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="advanced-filters-panel">
            {/* Priority Filter */}
            <div className="filter-item">
              <label className="filter-label">Priority</label>
              <select
                className="select-input"
                value={filters.priority}
                onChange={(e) => updateFilter('priority', e.target.value)}
              >
                <option value="All">All Priorities</option>
                <option value="High">🔥 High</option>
                <option value="Medium">⚡ Medium</option>
                <option value="Low">🌱 Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-item">
              <label className="filter-label">Status</label>
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
            </div>

            {/* Assignee Filter */}
            <div className="filter-item">
              <label className="filter-label">Assignee</label>
              <select
                className="select-input"
                value={filters.assignedTo}
                onChange={(e) => updateFilter('assignedTo', e.target.value)}
              >
                <option value="All">All Assignees</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Dependency State */}
            <div className="filter-item">
              <label className="filter-label">Dependency</label>
              <select
                className="select-input"
                value={filters.isBlocked}
                onChange={(e) => updateFilter('isBlocked', e.target.value)}
              >
                <option value="All">All States</option>
                <option value="true">🔒 Blocked Only</option>
                <option value="false">🔓 Ready / Unblocked</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
