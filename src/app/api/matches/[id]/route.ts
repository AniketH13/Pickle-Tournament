import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateScore } from '@/lib/scoring';

// PATCH /api/matches/[id] — submit match result
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

    // Validate score
    const validation = validateScore(
      Number(team1Score),
      Number(team2Score),
      scoreType
    );
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const match = await db.getMatch(id);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const winnerId = validation.winner === 1 ? match.team1Id : match.team2Id;

    const updated = await db.updateMatch(id, {
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

    return NextResponse.json({ match: updated });
  } catch (error) {
    console.error('PATCH /api/matches/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}

// DELETE /api/matches/[id] — reset match result
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await db.updateMatch(id, {
      status: 'PENDING',
      matchType: 'SINGLES',
      scoreType: 'ELEVEN',
      team1Player1: null,
      team1Player2: null,
      team2Player1: null,
      team2Player2: null,
      team1Score: null,
      team2Score: null,
      winnerId: null,
    });
    return NextResponse.json({ match: updated });
  } catch (error) {
    console.error('DELETE /api/matches/[id] error:', error);
    return NextResponse.json({ error: 'Failed to reset match' }, { status: 500 });
  }
}
