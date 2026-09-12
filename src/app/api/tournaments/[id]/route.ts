import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tournaments/[id] — full tournament data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = await db.getTournament(id);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }
    return NextResponse.json({ tournament });
  } catch (error) {
    console.error('GET /api/tournaments/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch tournament' }, { status: 500 });
  }
}

// DELETE /api/tournaments/[id] — delete tournament
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.deleteTournament(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/tournaments/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
  }
}
