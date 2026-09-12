'use client';

import StandingsTable from './StandingsTable';
import { computeGroupStandings } from '@/lib/scoring';

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  team1: Team;
  team2: Team;
  winner?: Team;
  winnerId?: string;
  matchType: string;
  scoreType: string;
  status: string;
  team1Score?: number;
  team2Score?: number;
  team1Player1?: string;
  team1Player2?: string;
  team2Player1?: string;
  team2Player2?: string;
  matchNumber: number;
  roundNumber: number;
}

interface Group {
  id: string;
  name: string;
  teams: Team[];
  matches: Match[];
}

interface Props {
  group: Group;
  onMatchClick: (match: Match) => void;
}

const SCORE_TYPE_SHORT: Record<string, string> = {
  ELEVEN: '11pts',
  FIFTEEN: '15pts Rally',
  TWENTY_ONE: '21pts',
};

export default function GroupView({ group, onMatchClick }: Props) {
  const standings = computeGroupStandings({
    teams: group.teams,
    matches: group.matches.map((m) => ({
      team1Id: m.team1Id,
      team2Id: m.team2Id,
      team1Score: m.team1Score ?? null,
      team2Score: m.team2Score ?? null,
      winnerId: m.winnerId ?? null,
      status: m.status,
    })),
  });
  const pendingCount = group.matches.filter((m) => m.status === 'PENDING').length;
  const doneCount = group.matches.filter((m) => m.status === 'COMPLETE').length;

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', minWidth: 100 }}>
          <div
            style={{
              height: '100%',
              width: `${(doneCount / group.matches.length) * 100}%`,
              background: doneCount === group.matches.length
                ? 'var(--green)'
                : 'linear-gradient(90deg, var(--accent), var(--cyan))',
              borderRadius: '3px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {doneCount}/{group.matches.length} matches done
        </span>
      </div>

      {/* Standings */}
      <div>
        <p className="section-title" style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          📊 Standings
        </p>
        <StandingsTable standings={standings} />
      </div>

      {/* Matches */}
      <div>
        <p className="section-title" style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          🎮 Match Schedule
          {pendingCount > 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 400, marginLeft: 8 }}>
              ({pendingCount} pending)
            </span>
          )}
        </p>
        <div className="matches-grid">
          {group.matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onClick={() => onMatchClick(match)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const isDone = match.status === 'COMPLETE';
  const t1Win = match.winnerId === match.team1Id;
  const t2Win = match.winnerId === match.team2Id;

  return (
    <div className="card card-hover match-card" onClick={onClick}>
      <span className="match-number">#{match.matchNumber}</span>

      <div className="match-teams">
        <span className={`match-team ${isDone ? (t1Win ? 'winner' : 'loser') : ''}`}>
          {match.team1.name}
        </span>
        <div>
          {isDone ? (
            <div className="match-score">
              {match.team1Score} – {match.team2Score}
            </div>
          ) : (
            <div className="match-vs">VS</div>
          )}
        </div>
        <span className={`match-team right ${isDone ? (t2Win ? 'winner' : 'loser') : ''}`}>
          {match.team2.name}
        </span>
      </div>

      <div className="match-status">
        {isDone && match.matchType && (
          <span className="match-type-badge">
            {match.matchType === 'SINGLES' ? '1v1' : '2v2'}
          </span>
        )}
        {isDone && match.scoreType && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {SCORE_TYPE_SHORT[match.scoreType]}
          </span>
        )}
        <span className="status-dot" style={{}} data-status={isDone ? 'complete' : 'pending'}>
          <span
            style={{
              display: 'block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isDone ? 'var(--green)' : 'var(--text-muted)',
              animation: isDone ? 'none' : 'pulse 2s infinite',
            }}
          />
        </span>
      </div>
    </div>
  );
}
