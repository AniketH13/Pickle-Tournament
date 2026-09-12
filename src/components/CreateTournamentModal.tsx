'use client';

import { useState } from 'react';

interface Props {
  onClose: () => void;
  onCreated: (id: string) => void;
}

const GROUP_LETTERS = 'ABCDEFGHIJK';

// Group count options per teams-per-group setting
const GROUP_OPTIONS: Record<number, number[]> = {
  3: [2, 3, 4, 6, 8],
  4: [2, 4, 6, 8],
};

// Matches generated for round-robin within a group
function matchCount(n: number) {
  return (n * (n - 1)) / 2;
}

interface TeamEntry {
  name: string;
  player1: string;
  player2: string;
}

export default function CreateTournamentModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [matchType, setMatchType] = useState<'SINGLES' | 'DOUBLES'>('DOUBLES');
  const [teamsPerGroup, setTeamsPerGroup] = useState(4);
  const [numGroups, setNumGroups] = useState(8);
  const [teams, setTeams] = useState<TeamEntry[][]>(
    Array.from({ length: 8 }, () =>
      Array.from({ length: 4 }, () => ({ name: '', player1: '', player2: '' }))
    )
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleTeamsPerGroupChange = (tpg: number) => {
    setTeamsPerGroup(tpg);
    // Reset to first valid group count for the new tpg
    const firstOption = GROUP_OPTIONS[tpg][0];
    setNumGroups(firstOption);
    setTeams(
      Array.from({ length: firstOption }, () =>
        Array.from({ length: tpg }, () => ({ name: '', player1: '', player2: '' }))
      )
    );
  };

  const handleNumGroupsChange = (n: number) => {
    setNumGroups(n);
    setTeams((prev) =>
      Array.from({ length: n }, (_, gi) =>
        Array.from({ length: teamsPerGroup }, (_, ti) => ({
          name: prev[gi]?.[ti]?.name ?? '',
          player1: prev[gi]?.[ti]?.player1 ?? '',
          player2: prev[gi]?.[ti]?.player2 ?? '',
        }))
      )
    );
  };

  const handleTeamField = (
    groupIdx: number,
    teamIdx: number,
    field: 'name' | 'player1' | 'player2',
    value: string
  ) => {
    setTeams((prev) => {
      const next = prev.map((g) => g.map((t) => ({ ...t })));
      next[groupIdx][teamIdx][field] = value;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Tournament name is required'); return; }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        matchType,
        groups: Array.from({ length: numGroups }, (_, i) => ({
          name: GROUP_LETTERS[i],
          teams: teams[i].map((t, ti) => ({
            name: t.name.trim() || `Open Slot ${ti + 1}`,
            player1: t.player1.trim() || undefined,
            player2: matchType === 'DOUBLES' ? (t.player2.trim() || undefined) : undefined,
          })),
        })),
      };

      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create tournament'); return; }
      onCreated(data.tournament.id);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalTeams = numGroups * teamsPerGroup;
  const matches = matchCount(teamsPerGroup);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 780 }}>
        <div className="modal-header">
          <h2 className="modal-title">🏓 Create New Tournament</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error">⚠️ {error}</div>
            )}

            {/* Tournament Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="tournament-name">
                Tournament Name *
              </label>
              <input
                id="tournament-name"
                className="form-input"
                placeholder="e.g. Kathmandu Open 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Match Format: Singles vs Doubles */}
            <div className="form-group">
              <label className="form-label">Format (Singles / Doubles)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn ${matchType === 'SINGLES' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px' }}
                  onClick={() => setMatchType('SINGLES')}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>👤 Singles</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>1 player per team</span>
                </button>
                <button
                  type="button"
                  className={`btn ${matchType === 'DOUBLES' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px' }}
                  onClick={() => setMatchType('DOUBLES')}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>👥 Doubles</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>2 players per team</span>
                </button>
              </div>
            </div>

            {/* Teams per group */}
            <div className="form-group">
              <label className="form-label">Teams per Group</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[3, 4].map((tpg) => (
                  <button
                    key={tpg}
                    type="button"
                    className={`btn btn-sm ${teamsPerGroup === tpg ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleTeamsPerGroupChange(tpg)}
                  >
                    {tpg} Teams
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      ({tpg === 4 ? '3 games/team' : '2 games/team'})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of groups */}
            <div className="form-group">
              <label className="form-label">Number of Groups</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {GROUP_OPTIONS[teamsPerGroup].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`btn btn-sm ${numGroups === n ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleNumGroupsChange(n)}
                  >
                    {n} Groups
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>({n * teamsPerGroup} teams)</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                {totalTeams} teams total · {matches} matches per group · each team plays {teamsPerGroup - 1} group games
              </p>
            </div>

            <div className="divider" />

            <div className="groups-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p className="form-label" style={{ margin: 0 }}>
                  Teams & Players ({teamsPerGroup} teams per group)
                </p>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>
                  💡 Leave team empty for Open Slot (you can edit anytime during tournament)!
                </span>
              </div>

              {Array.from({ length: numGroups }, (_, gi) => (
                <div key={gi} className="group-form-card">
                  <div className="group-form-header">
                    <div className="group-letter-badge">{GROUP_LETTERS[gi]}</div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Group {GROUP_LETTERS[gi]}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {matches} matches · 3 games per team
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Array.from({ length: teamsPerGroup }, (_, ti) => (
                      <div
                        key={ti}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: matchType === 'DOUBLES' ? '1.5fr 1fr 1fr' : '1.5fr 1.5fr',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <div className="team-input-wrap">
                            <span className="team-num">{ti + 1}</span>
                            <input
                              id={`group-${gi}-team-${ti}`}
                              className="form-input"
                              placeholder={`Team ${ti + 1} name (empty for Open Slot)`}
                              value={teams[gi]?.[ti]?.name ?? ''}
                              onChange={(e) => handleTeamField(gi, ti, 'name', e.target.value)}
                            />
                          </div>
                          <input
                            className="form-input"
                            style={{ fontSize: '0.82rem' }}
                            placeholder={matchType === 'DOUBLES' ? 'Player 1 name' : 'Player name (optional)'}
                            value={teams[gi]?.[ti]?.player1 ?? ''}
                            onChange={(e) => handleTeamField(gi, ti, 'player1', e.target.value)}
                          />
                          {matchType === 'DOUBLES' && (
                            <input
                              className="form-input"
                              style={{ fontSize: '0.82rem' }}
                              placeholder="Player 2 name"
                              value={teams[gi]?.[ti]?.player2 ?? ''}
                              onChange={(e) => handleTeamField(gi, ti, 'player2', e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : '🚀 Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
