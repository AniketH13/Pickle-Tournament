'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function PasswordInput({
  id, value, onChange, placeholder, label,
}: {
  id: string; value: string; onChange: (v: string) => void; placeholder: string; label: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="form-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          style={{ paddingRight: '3rem' }}
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            color: show ? 'var(--accent)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', zIndex: 10,
            borderRadius: '4px', transition: 'color 0.2s',
          }}
          aria-label={show ? 'Hide' : 'Show'}
          title={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to change password'); return; }
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-container">
      <Link href="/" className="back-btn">← Back to Dashboard</Link>

      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚙️ Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage your admin account settings
          </p>
        </div>

        {/* Account info card */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Image
            src="/logo.jpg"
            alt="PickleGo"
            width={48}
            height={48}
            style={{ height: 48, width: 'auto', borderRadius: '8px', objectFit: 'contain', flexShrink: 0 }}
          />
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>picklego@admin.com</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Administrator</p>
          </div>
          <span className="tournament-status-badge status-group_stage" style={{ marginLeft: 'auto' }}>
            Active
          </span>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>🔑 Change Password</h2>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                ✅ Password changed successfully! Use your new password next time you log in.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <PasswordInput
                id="current-password"
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <PasswordInput
                id="new-password"
                label="New Password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={setNewPassword}
              />
              <PasswordInput
                id="confirm-password"
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />

              {/* Live match check */}
              {newPassword && confirmPassword && (
                <p style={{
                  fontSize: '0.78rem',
                  color: newPassword === confirmPassword ? 'var(--green)' : 'var(--red)',
                  marginBottom: '1rem',
                  marginTop: '-0.5rem',
                }}>
                  {newPassword === confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push('/')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : '🔑 Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Tip */}
        <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
          💡 After changing your password, you can still use your current session. The new password will be required on your next login.
        </div>
      </div>
    </main>
  );
}
