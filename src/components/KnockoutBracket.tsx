'use client';

interface Team {
  id: string;
  name: string;
  group?: { name: string };
}

interface KnockoutMatch {
  id: string;
  round: string;
  position: number;
  team1Id?: string;
  team2Id?: string;
  team1?: Team;
  team2?: Team;
  winner?: Team;
  winnerId?: string;
  status: string;
  matchType: string;
  scoreType: string;
  team1Score?: number;
  team2Score?: number;
}

interface Props {
  matches: KnockoutMatch[];
  onMatchClick: (match: KnockoutMatch) => void;
  tournamentStatus?: string;
}

const ROUND_ORDER = ['QUARTERFINAL', 'SEMIFINAL', 'FINAL'];
const ROUND_LABELS: Record<string, string> = {
  QUARTERFINAL: '⚔️ Quarter-Finals',
  SEMIFINAL: '🥊 Semi-Finals',
  FINAL: '🏆 Final',
};

export default function KnockoutBracket({ matches, onMatchClick }: Props) {
  const rounds = ROUND_ORDER.filter((r) => matches.some((m) => m.round === r));
  const champion = matches.find((m) => m.round === 'FINAL' && m.status === 'COMPLETE')?.winner;

  return (
    <div>
      {/* Champion banner */}
      {champion && (
        <div className="bracket-winner-crown animate-in" style={{ marginBottom: '2rem', marginTop: 0 }}>
          <div className="crown-icon">👑</div>
          <h2>Champion</h2>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {champion.name}
          </p>
          {champion.group && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Group {champion.group.name} Winner
            </p>
          )}
        </div>
      )}

      {/* Info */}
      <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
        💡 Click on a match card to enter results. Winners automatically advance to the next round.
      </div>

      <div className="bracket-container">
        <div className="bracket">
          {rounds.map((round) => {
            const roundMatches = matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.position - b.position);

            return (
              <div key={round} className="bracket-round">
                <div className="bracket-round-title">{ROUND_LABELS[round]}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: round === 'FINAL' ? 0 : '1.5rem', justifyContent: 'space-around', flex: 1 }}>
                  {roundMatches.map((match) => (
                    <BracketMatchCard
                      key={match.id}
                      match={match}
                      onClick={() => {
                        // Only clickable if both teams present and either pending or editable
                        if (match.team1Id && match.team2Id) {
                          onMatchClick(match);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Legend:</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', marginRight: 4 }} />
          Winner
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'rgba(163,230,53,0.3)', marginRight: 4 }} />
          Ready to play
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--text-muted)', marginRight: 4 }} />
          Waiting
        </span>
      </div>
    </div>
  );
}

function BracketMatchCard({
  match,
  onClick,
}: {
  match: KnockoutMatch;
  onClick: () => void;
}) {
  const isComplete = match.status === 'COMPLETE';
  const isReady = !isComplete && match.team1Id && match.team2Id;
  const isBye = match.status === 'COMPLETE' && (!match.team1Score && !match.team2Score) && match.winnerId;

  const t1IsWinner = isComplete && match.winnerId === match.team1Id;
  const t2IsWinner = isComplete && match.winnerId === match.team2Id;

  const getClassName = () => {
    if (isBye) return 'bracket-match bracket-match-bye';
    if (isComplete) return 'bracket-match complete';
    if (isReady) return 'bracket-match ready';
    return 'bracket-match';
  };

  const formatTeamName = (team?: Team) => {
    if (!team) return null;
    return `${team.name}${team.group ? ` (G${team.group.name})` : ''}`;
  };

  return (
    <div className={getClassName()} onClick={onClick} title={isReady ? 'Click to enter result' : isComplete ? 'Click to view/edit result' : 'Waiting for teams'}>
      {/* Status indicator */}
      <div style={{
        height: '3px',
        background: isComplete ? 'var(--green)' : isReady ? 'var(--accent)' : 'var(--border)',
      }} />

      {/* Team 1 */}
      <div className={`bracket-team ${t1IsWinner ? 'winner' : isComplete ? 'loser' : !match.team1Id ? 'tbd' : ''}`}>
        <span className="bracket-team-name">
          {match.team1 ? formatTeamName(match.team1) : 'TBD'}
        </span>
        {isComplete && !isBye && (
          <span className="bracket-team-score">{match.team1Score}</span>
        )}
        {t1IsWinner && <span style={{ fontSize: '0.7rem' }}>🏆</span>}
      </div>

      {/* Team 2 */}
      <div className={`bracket-team ${t2IsWinner ? 'winner' : isComplete ? 'loser' : !match.team2Id ? 'tbd' : ''}`}>
        <span className="bracket-team-name">
          {match.team2 ? formatTeamName(match.team2) : 'TBD'}
        </span>
        {isComplete && !isBye && (
          <span className="bracket-team-score">{match.team2Score}</span>
        )}
        {t2IsWinner && <span style={{ fontSize: '0.7rem' }}>🏆</span>}
      </div>

      {/* Match info footer */}
      {isComplete && !isBye && (
        <div style={{ padding: '4px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: '6px', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {match.matchType === 'SINGLES' ? '1v1' : '2v2'} ·{' '}
            {match.scoreType === 'ELEVEN' ? '11pts' : match.scoreType === 'FIFTEEN' ? '15pts Rally' : '21pts'}
          </span>
        </div>
      )}

      {isReady && (
        <div style={{ padding: '4px 14px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 600 }}>▶ Enter Result</span>
        </div>
      )}

      {isBye && (
        <div style={{ padding: '4px 14px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>BYE — auto advanced</span>
        </div>
      )}
    </div>
  );
}
