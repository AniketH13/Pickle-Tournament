export type ScoreTypeKey = 'ELEVEN' | 'FIFTEEN' | 'TWENTY_ONE';

export const SCORE_LABELS: Record<ScoreTypeKey, string> = {
  ELEVEN: '11 Points',
  FIFTEEN: '15 Points (Rally)',
  TWENTY_ONE: '21 Points',
};

export const SCORE_THRESHOLDS: Record<ScoreTypeKey, number> = {
  ELEVEN: 11,
  FIFTEEN: 15,
  TWENTY_ONE: 21,
};

export interface ScoreValidationResult {
  valid: boolean;
  error?: string;
  winner?: 1 | 2;
}

export function validateScore(
  score1: number,
  score2: number,
  scoreType: ScoreTypeKey
): ScoreValidationResult {
  const threshold = SCORE_THRESHOLDS[scoreType];

  if (isNaN(score1) || isNaN(score2)) {
    return { valid: false, error: 'Scores must be valid numbers' };
  }
  if (score1 < 0 || score2 < 0) {
    return { valid: false, error: 'Scores cannot be negative' };
  }

  const maxScore = Math.max(score1, score2);
  const diff = Math.abs(score1 - score2);

  if (maxScore < threshold) {
    return {
      valid: false,
      error: `Winner must reach at least ${threshold} points`,
    };
  }
  if (diff < 2) {
    return {
      valid: false,
      error: 'Winner must lead by at least 2 points (win-by-2 rule)',
    };
  }

  return { valid: true, winner: score1 > score2 ? 1 : 2 };
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  played: number;
  pointsScored: number;
  pointsConceded: number;
  pointDiff: number;
  rank: number;
  isGroupWinner: boolean;
}

export function computeGroupStandings(group: {
  teams: Array<{ id: string; name: string }>;
  matches: Array<{
    team1Id: string;
    team2Id: string;
    team1Score: number | null;
    team2Score: number | null;
    winnerId: string | null;
    status: string;
  }>;
}): TeamStanding[] {
  const standings = group.teams.map((team) => {
    const completedMatches = group.matches.filter(
      (m) =>
        m.status === 'COMPLETE' &&
        (m.team1Id === team.id || m.team2Id === team.id)
    );

    let wins = 0;
    let losses = 0;
    let pointsScored = 0;
    let pointsConceded = 0;

    for (const match of completedMatches) {
      if (match.winnerId === team.id) wins++;
      else losses++;

      if (match.team1Id === team.id) {
        pointsScored += match.team1Score ?? 0;
        pointsConceded += match.team2Score ?? 0;
      } else {
        pointsScored += match.team2Score ?? 0;
        pointsConceded += match.team1Score ?? 0;
      }
    }

    return {
      teamId: team.id,
      teamName: team.name,
      wins,
      losses,
      played: wins + losses,
      pointsScored,
      pointsConceded,
      pointDiff: pointsScored - pointsConceded,
    };
  });

  standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return b.pointsScored - a.pointsScored;
  });

  return standings.map((s, idx) => ({
    ...s,
    rank: idx + 1,
    isGroupWinner: idx === 0,
  }));
}
