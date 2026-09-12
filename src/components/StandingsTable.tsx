'use client';

import { TeamStanding } from '@/lib/scoring';

interface Props {
  standings: TeamStanding[];
}

export default function StandingsTable({ standings }: Props) {
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
          {standings.map((s) => (
            <tr key={s.teamId} className={s.isGroupWinner ? 'winner-row' : ''}>
              <td>
                <span className={`rank-badge rank-${s.rank}`}>{s.rank}</span>
              </td>
              <td>
                <span style={{ fontWeight: 600 }}>{s.teamName}</span>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
