'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, UserPlus, AlertCircle } from 'lucide-react';

export default function UserModal({ isOpen, onClose }) {
  const { createUser, loginUser } = useApp();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Fullstack Developer');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !name.trim()) {
      setErrorMsg('Username and Full Name are required.');
      return;
    }

    try {
      setSubmitting(true);
      const newUser = await createUser({
        username: username.trim(),
        name: name.trim(),
        email: email.trim() || `${username.trim().toLowerCase()}@immverse.ai`,
        role: role.trim() || 'Team Member'
      });

      if (newUser && newUser.id) {
        loginUser(newUser.id);
      }

      onClose();
      setUsername('');
      setName('');
      setEmail('');
      setRole('Fullstack Developer');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={20} style={{ color: '#6366F1' }} /> Create New User
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
              Add a new team member to assign tasks and manage dependencies.
            </p>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: 8, color: '#F87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. john_doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. john@immverse.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">System Role *</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Member">👤 Member (Can only view & complete assigned tasks)</option>
                <option value="Admin">👑 Admin (Full visibility & task management)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
