'use client';

import { useState } from 'react';
import { SCORE_LABELS, SCORE_THRESHOLDS, ScoreTypeKey, validateScore } from '@/lib/scoring';

interface Team {
  id: string;
  name: string;
  player1?: string | null;
  player2?: string | null;
  group?: { name: string };
}

interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  team1: Team;
  team2: Team;
  winner?: Team;
  winnerId?: string;
  matchType?: string;
  scoreType?: string;
  status: string;
  team1Score?: number;
  team2Score?: number;
  team1Player1?: string;
  team1Player2?: string;
  team2Player1?: string;
  team2Player2?: string;
}

interface Props {
  match: Match;
  isKnockout: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

type MatchTypeVal = 'SINGLES' | 'DOUBLES';

export default function MatchModal({ match, isKnockout, onClose, onSubmit }: Props) {
  const isComplete = match.status === 'COMPLETE';

  const [matchType, setMatchType] = useState<MatchTypeVal>(
    (match.matchType as MatchTypeVal) || 'DOUBLES'
  );
  const [scoreType, setScoreType] = useState<ScoreTypeKey>(
    (match.scoreType as ScoreTypeKey) || 'ELEVEN'
  );
  const [t1p1, setT1p1] = useState(match.team1Player1 || match.team1?.player1 || '');
  const [t1p2, setT1p2] = useState(match.team1Player2 || match.team1?.player2 || '');
  const [t2p1, setT2p1] = useState(match.team2Player1 || match.team2?.player1 || '');
  const [t2p2, setT2p2] = useState(match.team2Player2 || match.team2?.player2 || '');
  const [score1, setScore1] = useState(match.team1Score?.toString() || '');
  const [score2, setScore2] = useState(match.team2Score?.toString() || '');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const endpoint = isKnockout
    ? `/api/knockout-matches/${match.id}`
    : `/api/matches/${match.id}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const s1 = Number(score1);
    const s2 = Number(score2);

    const validation = validateScore(s1, s2, scoreType);
    if (!validation.valid) { setError(validation.error!); return; }

    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchType,
          scoreType,
          team1Player1: t1p1 || undefined,
          team1Player2: matchType === 'DOUBLES' ? t1p2 || undefined : undefined,
          team2Player1: t2p1 || undefined,
          team2Player2: matchType === 'DOUBLES' ? t2p2 || undefined : undefined,
          team1Score: s1,
          team2Score: s2,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save match'); return; }
      onSubmit();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) { setError('Failed to reset match'); return; }
      onSubmit();
    } catch {
      setError('Network error');
    } finally {
      setResetting(false);
    }
  };

  const threshold = SCORE_THRESHOLDS[scoreType];
  const t1Label = `${match.team1.name}${match.team1.group ? ` (Grp ${match.team1.group.name})` : ''}`;
  const t2Label = `${match.team2.name}${match.team2.group ? ` (Grp ${match.team2.group.name})` : ''}`;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {isKnockout ? '🏆 Knockout Match' : '⚡ Group Match'}
            </p>
            <h2 className="modal-title" style={{ fontSize: '1rem' }}>
              {match.team1.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs</span> {match.team2.name}
            </h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {isComplete && (
              <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                ✅ This match is complete. You can reset it to re-enter the result.
              </div>
            )}

            {error && <div className="alert alert-error">⚠️ {error}</div>}

            {/* Match Type */}
            <div className="form-group">
              <label className="form-label">Match Type</label>
              <div className="toggle-group">
                {(['SINGLES', 'DOUBLES'] as MatchTypeVal[]).map((type) => (
                  <label key={type} className="toggle-option">
                    <input
                      type="radio"
                      name="matchType"
                      value={type}
                      checked={matchType === type}
                      onChange={() => setMatchType(type)}
                      disabled={isComplete}
                    />
                    <span className="toggle-label">
                      <span className="toggle-check">
                        {matchType === type && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="#0a0f1e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      {type === 'SINGLES' ? '☐ Singles (1v1)' : '☐ Doubles (2v2)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Score Type */}
            <div className="form-group">
              <label className="form-label">Score Format</label>
              <div className="score-type-group">
                {(Object.keys(SCORE_LABELS) as ScoreTypeKey[]).map((key) => (
                  <label key={key} className="score-type-option">
                    <input
                      type="radio"
                      name="scoreType"
                      value={key}
                      checked={scoreType === key}
                      onChange={() => setScoreType(key)}
                      disabled={isComplete}
                    />
                    <span className="score-type-label">
                      <span className="score-num">{SCORE_THRESHOLDS[key]}</span>
                      <span className="score-sub">
                        {key === 'ELEVEN' ? 'Points' : key === 'FIFTEEN' ? 'Rally' : 'Points'}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Win by 2 rule enforced · First to {threshold} (lead by 2+)
              </p>
            </div>

            <div className="divider" />

            {/* Player Names */}
            <div className="form-group">
              <label className="form-label">
                {matchType === 'SINGLES' ? 'Player Names (optional)' : 'Team Players (optional)'}
              </label>
              <div className="players-grid">
                {/* Team 1 */}
                <div className="player-team-col">
                  <div className="team-header">{t1Label}</div>
                  <input
                    id="t1p1"
                    className="form-input"
                    placeholder="Player 1 name"
                    value={t1p1}
                    onChange={(e) => setT1p1(e.target.value)}
                    disabled={isComplete}
                    style={{ marginBottom: matchType === 'DOUBLES' ? '8px' : 0 }}
                  />
                  {matchType === 'DOUBLES' && (
                    <input
                      id="t1p2"
                      className="form-input"
                      placeholder="Player 2 name"
                      value={t1p2}
                      onChange={(e) => setT1p2(e.target.value)}
                      disabled={isComplete}
                    />
                  )}
                </div>

                {/* Team 2 */}
                <div className="player-team-col">
                  <div className="team-header" style={{ background: 'rgba(34,211,238,0.05)', borderColor: 'rgba(34,211,238,0.2)', color: 'var(--cyan)' }}>
                    {t2Label}
                  </div>
                  <input
                    id="t2p1"
                    className="form-input"
                    placeholder="Player 1 name"
                    value={t2p1}
                    onChange={(e) => setT2p1(e.target.value)}
                    disabled={isComplete}
                    style={{ marginBottom: matchType === 'DOUBLES' ? '8px' : 0 }}
                  />
                  {matchType === 'DOUBLES' && (
                    <input
                      id="t2p2"
                      className="form-input"
                      placeholder="Player 2 name"
                      value={t2p2}
                      onChange={(e) => setT2p2(e.target.value)}
                      disabled={isComplete}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* Score */}
            <div className="form-group">
              <label className="form-label">Score</label>
              <div className="score-inputs">
                <div className="score-input-wrap">
                  <span className="team-label">{match.team1.name}</span>
                  <input
                    id="score1"
                    type="number"
                    min="0"
                    max="99"
                    className="score-num-input"
                    value={score1}
                    onChange={(e) => setScore1(e.target.value)}
                    placeholder="0"
                    disabled={isComplete}
                  />
                </div>
                <div className="score-vs">–</div>
                <div className="score-input-wrap">
                  <span className="team-label">{match.team2.name}</span>
                  <input
                    id="score2"
                    type="number"
                    min="0"
                    max="99"
                    className="score-num-input"
                    value={score2}
                    onChange={(e) => setScore2(e.target.value)}
                    placeholder="0"
                    disabled={isComplete}
                  />
                </div>
              </div>

              {/* Live validation feedback */}
              {score1 !== '' && score2 !== '' && !isComplete && (() => {
                const v = validateScore(Number(score1), Number(score2), scoreType);
                if (!v.valid) return <p className="alert alert-error" style={{ marginTop: '0.75rem', padding: '8px 12px' }}>⚠️ {v.error}</p>;
                const winTeam = v.winner === 1 ? match.team1.name : match.team2.name;
                return <p className="alert alert-success" style={{ marginTop: '0.75rem', padding: '8px 12px' }}>✅ Valid score · {winTeam} wins</p>;
              })()}
            </div>
          </div>

          <div className="modal-footer">
            {isComplete ? (
              <>
                <button type="button" className="btn btn-danger" onClick={handleReset} disabled={resetting}>
                  {resetting ? 'Resetting…' : '↩ Reset Result'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : '✓ Save Result'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
