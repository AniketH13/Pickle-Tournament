'use client';

import { useState } from 'react';

export interface EditableTeam {
  id: string;
  name: string;
  player1?: string | null;
  player2?: string | null;
  group?: { name: string };
}

interface Props {
  team: EditableTeam;
  matchType?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditTeamModal({ team, matchType = 'DOUBLES', onClose, onSaved }: Props) {
  const isDoubles = matchType === 'DOUBLES';
  const [name, setName] = useState(team.name);
  const [player1, setPlayer1] = useState(team.player1 || '');
  const [player2, setPlayer2] = useState(team.player2 || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Team name cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          player1: player1.trim() || null,
          player2: isDoubles ? (player2.trim() || null) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update team');
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">✏️ Edit Team / Fill Slot</h2>
            {team.group?.name && (
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Group {team.group.name}
              </p>
            )}
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="edit-team-name">
                Team Name *
              </label>
              <input
                id="edit-team-name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kathmandu Aces"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-player-1">
                {isDoubles ? 'Player 1' : 'Player Name (optional)'}
              </label>
              <input
                id="edit-player-1"
                className="form-input"
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>

            {isDoubles && (
              <div className="form-group">
                <label className="form-label" htmlFor="edit-player-2">
                  Player 2
                </label>
                <input
                  id="edit-player-2"
                  className="form-input"
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  placeholder="e.g. Jane Smith"
                />
              </div>
            )}

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '6px' }}>
              💡 Updating this team will update its name in standings, brackets, and sync player names to all upcoming pending matches.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
