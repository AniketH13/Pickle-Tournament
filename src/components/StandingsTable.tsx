'use client';

import { TeamStanding } from '@/lib/scoring';

interface TeamInfo {
  id: string;
  name: string;
  player1?: string | null;
  player2?: string | null;
  group?: { name: string };
}

interface Props {
  standings: TeamStanding[];
  teams?: TeamInfo[];
  onEditTeam?: (team: TeamInfo) => void;
}

export default function StandingsTable({ standings, teams, onEditTeam }: Props) {
  const teamMap = new Map<string, TeamInfo>();
  if (teams) {
    teams.forEach((t) => teamMap.set(t.id, t));
  }

  return (
    <div className="standings-table-wrap">
      <table className="standings-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Team</th>
            <th style={{ textAlign: 'center' }}>W</th>
            <th style={{ textAlign: 'center' }}>L</th>
            <th style={{ textAlign: 'center' }}>Played</th>
            <th style={{ textAlign: 'center' }}>+/−</th>
            <th style={{ textAlign: 'right' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => {
            const teamData = teamMap.get(s.teamId);
            const lowerName = s.teamName.toLowerCase();
            const isOpenSlot =
              lowerName.startsWith('open slot') ||
              lowerName.includes('tbd') ||
              lowerName.startsWith('slot ');

            return (
              <tr key={s.teamId} className={s.isGroupWinner ? 'winner-row' : ''}>
                <td>
                  <span className={`rank-badge rank-${s.rank}`}>{s.rank}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{s.teamName}</span>
                    {isOpenSlot && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(234, 179, 8, 0.15)',
                          color: '#facc15',
                          border: '1px solid rgba(234, 179, 8, 0.35)',
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                        }}
                      >
                        Open Slot
                      </span>
                    )}
                    {onEditTeam && (
                      <button
                        onClick={() => onEditTeam(teamData || { id: s.teamId, name: s.teamName })}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          transition: 'all 0.2s ease',
                        }}
                        title="Edit team / fill slot"
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                      >
                        ✏️ <span>Edit</span>
                      </button>
                    )}
                  </div>
                  {teamData && (teamData.player1 || teamData.player2) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {[teamData.player1, teamData.player2].filter(Boolean).join(' & ')}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ color: s.wins > 0 ? 'var(--green)' : 'var(--text-muted)', fontWeight: 700 }}>
                    {s.wins}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ color: s.losses > 0 ? 'var(--red)' : 'var(--text-muted)', fontWeight: 700 }}>
                    {s.losses}
                  </span>
                </td>
                <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{s.played}</td>
                <td style={{ textAlign: 'center' }}>
                  <span
                    className={
                      s.pointDiff > 0
                        ? 'stat-positive'
                        : s.pointDiff < 0
                        ? 'stat-negative'
                        : 'stat-neutral'
                    }
                    style={{ fontWeight: 600 }}
                  >
                    {s.pointDiff > 0 ? '+' : ''}{s.pointDiff}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {s.isGroupWinner ? (
                    <span className="promoted-tag">🏆 Leader</span>
                  ) : s.played === 0 ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
