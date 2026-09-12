import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tournaments — list all tournaments
export async function GET() {
  try {
    const tournaments = await db.listTournaments();
    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error('GET /api/tournaments error:', error);
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
  }
}

// POST /api/tournaments — create a new tournament
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, matchType = 'DOUBLES', groups } = body as {
      name: string;
      matchType?: 'SINGLES' | 'DOUBLES';
      groups: Array<{
        name: string;
        teams: Array<string | { name: string; player1?: string; player2?: string }>;
      }>;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Tournament name is required' }, { status: 400 });
    }
    if (!groups || groups.length < 2) {
      return NextResponse.json({ error: 'At least 2 groups are required' }, { status: 400 });
    }

    const normalizedGroups = groups.map((g) => ({
      name: g.name,
      teams: g.teams.map((t) => {
        if (typeof t === 'string') {
          return { name: t.trim(), player1: undefined, player2: undefined };
        }
        return {
          name: t.name.trim(),
          player1: t.player1?.trim() || undefined,
          player2: t.player2?.trim() || undefined,
        };
      }),
    }));

    for (const g of normalizedGroups) {
      if (g.teams.length < 3 || g.teams.length > 4) {
        return NextResponse.json({ error: 'Each group must have 3 or 4 teams' }, { status: 400 });
      }
      if (g.teams.some((t) => !t.name)) {
        return NextResponse.json({ error: 'All team names are required' }, { status: 400 });
      }
    }

    const tournament = await db.createTournament(name.trim(), normalizedGroups, matchType);
    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tournaments error:', error);
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}
