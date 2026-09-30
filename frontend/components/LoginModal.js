'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, LogIn, AlertCircle, Check } from 'lucide-react';
import { api } from '../lib/api';

export default function LoginModal({ isOpen, onClose, onOpenRegister }) {
  const { loginUser, users, currentUser } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter a username or email.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.loginUser({ username: identifier.trim() });
      if (res.success && res.data) {
        loginUser(res.data);
        onClose();
        setIdentifier('');
      }
    } catch (err) {
      setErrorMsg(err.message || 'User not found. Check spelling or create a new user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectUser = (user) => {
    loginUser(user);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogIn size={20} style={{ color: '#6366F1' }} /> Switch / Login User (Mock Auth)
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
              Select a team member below or enter a username to switch your active session.
            </p>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: 8, color: '#F87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {/* Quick-Pick Existing Users */}
            <div className="form-group">
              <label className="form-label">Available Team Members</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {users.map(u => {
                  const isSelected = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.04)',
                        border: isSelected ? '1px solid #6366F1' : '1px solid var(--bg-card-border)',
                        color: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div 
                          className="avatar-circle" 
                          style={{ backgroundColor: u.avatarColor, width: 28, height: 28, fontSize: '0.75rem' }}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>@{u.username} • {u.role}</div>
                        </div>
                      </div>
                      {isSelected && <Check size={16} style={{ color: '#6366F1' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Or enter username manually */}
            <div className="form-group">
              <label className="form-label">Or Login by Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. alex_dev"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              style={{ fontSize: '0.82rem', color: '#6366F1', fontWeight: 600 }}
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
            >
              + Create New User
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Logging in...' : 'Log In'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
