import { NextResponse } from 'next/server';
import { db, KnockoutRound } from '@/lib/db';
import { computeGroupStandings } from '@/lib/scoring';

// POST /api/tournaments/[id]/advance — promote group winners to knockout stage
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    const tournament = await db.getTournamentForAdvance(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Verify all group matches are complete
    for (const group of tournament.groups) {
      const pending = group.matches.filter((m: { status: string }) => m.status === 'PENDING');
      if (pending.length > 0) {
        return NextResponse.json(
          { error: `Group ${group.name} still has ${pending.length} pending match(es)` },
          { status: 400 }
        );
      }
    }

    // Get group winners in group order
    const winners = tournament.groups.map((group: Parameters<typeof computeGroupStandings>[0]) => {
      const standings = computeGroupStandings(group);
      return standings[0]; // top ranked team
    });

    const winnerTeamIds = winners.map((w: { teamId: string }) => w.teamId);
    const numTeams = winnerTeamIds.length;

    // Delete existing knockout matches (in case of re-advance)
    await db.deleteKnockoutMatchesByTournament(tournamentId);

    // Generate bracket
    if (numTeams === 2) {
      await db.createKnockoutMatch({
        tournamentId,
        round: 'FINAL',
        position: 1,
        team1Id: winnerTeamIds[0],
        team2Id: winnerTeamIds[1],
      });
    } else if (numTeams <= 4) {
      // Create 2 Semifinals + 1 Final
      const s1t1 = winnerTeamIds[0] ?? null;
      const s1t2 = winnerTeamIds[3] ?? null;
      const s2t1 = winnerTeamIds[1] ?? null;
      const s2t2 = winnerTeamIds[2] ?? null;

      const [sf1, sf2, finalMatch] = await db.createKnockoutMatches([
        { tournamentId, round: 'SEMIFINAL', position: 1, team1Id: s1t1, team2Id: s1t2 },
        { tournamentId, round: 'SEMIFINAL', position: 2, team1Id: s2t1, team2Id: s2t2 },
        { tournamentId, round: 'FINAL', position: 1 },
      ]);

      // Auto-advance byes
      if (sf1 && !sf1.team2Id && sf1.team1Id) {
        await db.updateKnockoutMatch(sf1.id, { winnerId: sf1.team1Id, status: 'COMPLETE', team1Score: 0, team2Score: 0 });
        await db.updateKnockoutMatch(finalMatch.id, { team1Id: sf1.team1Id });
      }
      if (sf2 && !sf2.team2Id && sf2.team1Id) {
        await db.updateKnockoutMatch(sf2.id, { winnerId: sf2.team1Id, status: 'COMPLETE', team1Score: 0, team2Score: 0 });
        await db.updateKnockoutMatch(finalMatch.id, { team2Id: sf2.team1Id });
      }
    } else {
      // 5+ teams: Quarterfinals (4) + Semifinals (2) + Final (1)
      const qfPairs: [number, number][] = [
        [0, 7], [3, 4], [1, 6], [2, 5],
      ];

      const qfData = qfPairs.map(([s1, s2], pos) => ({
        tournamentId,
        round: 'QUARTERFINAL' as KnockoutRound,
        position: pos + 1,
        team1Id: winnerTeamIds[s1] ?? null,
        team2Id: winnerTeamIds[s2] ?? null,
      }));

      const qfMatches = await db.createKnockoutMatches(qfData);
      const [sf1, sf2] = await db.createKnockoutMatches([
        { tournamentId, round: 'SEMIFINAL', position: 1 },
        { tournamentId, round: 'SEMIFINAL', position: 2 },
        { tournamentId, round: 'FINAL', position: 1 },
      ]);

      const sfMatches = [sf1, sf2];

      // Auto-advance byes in QF
      for (const qf of qfMatches) {
        if (qf.team1Id && !qf.team2Id) {
          await db.updateKnockoutMatch(qf.id, { winnerId: qf.team1Id, status: 'COMPLETE' });
          const sfIndex = Math.floor((qf.position - 1) / 2);
          const slotInSf = (qf.position - 1) % 2 === 0 ? 'team1Id' : 'team2Id';
          if (sfMatches[sfIndex]) {
            await db.updateKnockoutMatch(sfMatches[sfIndex].id, { [slotInSf]: qf.team1Id });
          }
        }
      }
    }

    // Update tournament status
    await db.updateTournamentStatus(tournamentId, 'KNOCKOUT');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/tournaments/[id]/advance error:', error);
    return NextResponse.json({ error: 'Failed to advance tournament' }, { status: 500 });
  }
}
