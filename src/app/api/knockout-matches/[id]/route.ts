import { NextResponse } from 'next/server';
import { db, KnockoutMatch, KnockoutRound } from '@/lib/db';
import { validateScore } from '@/lib/scoring';

// PATCH /api/knockout-matches/[id] — submit knockout match result
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      matchType,
      scoreType,
      team1Player1,
      team1Player2,
      team2Player1,
      team2Player2,
      team1Score,
      team2Score,
    } = body;

    const validation = validateScore(
      Number(team1Score),
      Number(team2Score),
      scoreType
    );
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const match = await db.getKnockoutMatch(id);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    if (!match.team1Id || !match.team2Id) {
      return NextResponse.json({ error: 'Match is not ready (teams not assigned)' }, { status: 400 });
    }

    const winnerId = validation.winner === 1 ? match.team1Id : match.team2Id;

    await db.updateKnockoutMatch(id, {
      matchType,
      scoreType,
      team1Player1: team1Player1 || null,
      team1Player2: matchType === 'DOUBLES' ? (team1Player2 || null) : null,
      team2Player1: team2Player1 || null,
      team2Player2: matchType === 'DOUBLES' ? (team2Player2 || null) : null,
      team1Score: Number(team1Score),
      team2Score: Number(team2Score),
      winnerId,
      status: 'COMPLETE',
    });

    // Advance winner to the next round
    await advanceKnockoutWinner(match, winnerId);

    // Check if tournament is complete (Final is done)
    if (match.round === 'FINAL') {
      await db.updateTournamentStatus(match.tournamentId, 'COMPLETE');
    }

    const updated = await db.getKnockoutMatch(id);
    return NextResponse.json({ match: updated });
  } catch (error) {
    console.error('PATCH /api/knockout-matches/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update knockout match' }, { status: 500 });
  }
}

async function advanceKnockoutWinner(
  match: { id: string; tournamentId: string; round: string; position: number },
  winnerId: string
) {
  let nextRound: KnockoutRound | null = null;
  let nextPosition: number;
  let slot: 'team1Id' | 'team2Id';
  let p1Slot: 'team1Player1' | 'team2Player1';
  let p2Slot: 'team1Player2' | 'team2Player2';

  if (match.round === 'QUARTERFINAL') {
    nextRound = 'SEMIFINAL';
    nextPosition = Math.ceil(match.position / 2);
    slot = match.position % 2 === 1 ? 'team1Id' : 'team2Id';
    p1Slot = match.position % 2 === 1 ? 'team1Player1' : 'team2Player1';
    p2Slot = match.position % 2 === 1 ? 'team1Player2' : 'team2Player2';
  } else if (match.round === 'SEMIFINAL') {
    nextRound = 'FINAL';
    nextPosition = 1;
    slot = match.position === 1 ? 'team1Id' : 'team2Id';
    p1Slot = match.position === 1 ? 'team1Player1' : 'team2Player1';
    p2Slot = match.position === 1 ? 'team1Player2' : 'team2Player2';
  } else {
    return;
  }

  if (!nextRound) return;

  const nextMatch = await db.findKnockoutMatch(match.tournamentId, nextRound, nextPosition);
  if (nextMatch) {
    const patch: Partial<KnockoutMatch> = { [slot]: winnerId };
    // Also copy player names from winner match if present
    const fullMatch = await db.getKnockoutMatch(match.id);
    if (fullMatch) {
      const isTeam1Winner = fullMatch.team1Id === winnerId;
      patch[p1Slot] = isTeam1Winner ? fullMatch.team1Player1 : fullMatch.team2Player1;
      patch[p2Slot] = isTeam1Winner ? fullMatch.team1Player2 : fullMatch.team2Player2;
    }
    await db.updateKnockoutMatch(nextMatch.id, patch);
  }
}

// DELETE /api/knockout-matches/[id] — reset knockout match
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const match = await db.getKnockoutMatch(id);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Clear the winner from next round match
    if (match.winnerId && match.round !== 'FINAL') {
      let nextRound: KnockoutRound;
      let nextPosition: number;
      let slot: string;

      if (match.round === 'QUARTERFINAL') {
        nextRound = 'SEMIFINAL';
        nextPosition = Math.ceil(match.position / 2);
        slot = match.position % 2 === 1 ? 'team1Id' : 'team2Id';
      } else {
        nextRound = 'FINAL';
        nextPosition = 1;
        slot = match.position === 1 ? 'team1Id' : 'team2Id';
      }

      const nextMatch = await db.findKnockoutMatch(match.tournamentId, nextRound, nextPosition);
      if (nextMatch) {
        await db.updateKnockoutMatch(nextMatch.id, { [slot]: null, status: 'PENDING', winnerId: null });
      }
    }

    await db.updateKnockoutMatch(id, {
      status: 'PENDING',
      team1Score: null,
      team2Score: null,
      winnerId: null,
      team1Player1: null,
      team1Player2: null,
      team2Player1: null,
      team2Player2: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/knockout-matches/[id] error:', error);
    return NextResponse.json({ error: 'Failed to reset knockout match' }, { status: 500 });
  }
}
