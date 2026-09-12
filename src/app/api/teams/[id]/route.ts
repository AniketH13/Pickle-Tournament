import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/teams/[id] — fetch team details
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const team = await db.getTeam(id);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json({ team });
  } catch (error) {
    console.error('GET /api/teams/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

// PATCH /api/teams/[id] — update team name and roster
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, player1, player2 } = body;

    const existing = await db.getTeam(id);
    if (!existing) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Team name cannot be empty' }, { status: 400 });
    }

    const updated = await db.updateTeam(id, {
      name: name !== undefined ? name.trim() : undefined,
      player1: player1 !== undefined ? player1.trim() || null : undefined,
      player2: player2 !== undefined ? player2.trim() || null : undefined,
    });

    return NextResponse.json({ success: true, team: updated });
  } catch (error) {
    console.error('PATCH /api/teams/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}
