/**
 * db.ts — Relational DBMS layer powered by Prisma ORM and Supabase PostgreSQL.
 * Optimized for serverless and PgBouncer pooler environments.
 */

import crypto from 'crypto';
import { prisma } from './prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TournamentStatus = 'SETUP' | 'GROUP_STAGE' | 'KNOCKOUT' | 'COMPLETE';
export type MatchType = 'SINGLES' | 'DOUBLES';
export type ScoreType = 'ELEVEN' | 'FIFTEEN' | 'TWENTY_ONE';
export type MatchStatus = 'PENDING' | 'COMPLETE';
export type KnockoutRound = 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL';

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  matchType?: MatchType;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  tournamentId: string;
  name: string;
  groupNumber: number;
}

export interface Team {
  id: string;
  groupId: string;
  name: string;
  player1?: string | null;
  player2?: string | null;
}

export interface Match {
  id: string;
  groupId: string;
  matchType: MatchType;
  scoreType: ScoreType;
  status: MatchStatus;
  team1Id: string;
  team2Id: string;
  team1Player1: string | null;
  team1Player2: string | null;
  team2Player1: string | null;
  team2Player2: string | null;
  team1Score: number | null;
  team2Score: number | null;
  winnerId: string | null;
  matchNumber: number;
  roundNumber: number;
}

export interface KnockoutMatch {
  id: string;
  tournamentId: string;
  round: KnockoutRound;
  position: number;
  matchType: MatchType;
  scoreType: ScoreType;
  status: MatchStatus;
  team1Id: string | null;
  team2Id: string | null;
  team1Player1: string | null;
  team1Player2: string | null;
  team2Player1: string | null;
  team2Player2: string | null;
  team1Score: number | null;
  team2Score: number | null;
  winnerId: string | null;
}

export type InputKnockoutMatch = {
  tournamentId: string;
  round: KnockoutRound;
  position: number;
  team1Id?: string | null;
  team2Id?: string | null;
  matchType?: MatchType;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const db = {
  // ── Tournaments ─────────────────────────────────────────────────────────────

  async listTournaments() {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        groups: {
          include: {
            _count: {
              select: { teams: true, matches: true },
            },
          },
        },
      },
    });

    return tournaments.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      _count: { groups: t.groups.length },
      groups: t.groups.map((g) => ({
        _count: {
          teams: g._count.teams,
          matches: g._count.matches,
        },
      })),
    }));
  },

  async createTournament(
    name: string,
    groupsInput: { name: string; teams: { name: string; player1?: string; player2?: string }[] }[],
    matchType: MatchType = 'DOUBLES'
  ) {
    const tournamentId = crypto.randomUUID();
    const groupsToInsert: { id: string; tournamentId: string; name: string; groupNumber: number }[] = [];
    const teamsToInsert: { id: string; groupId: string; name: string; player1: string | null; player2: string | null }[] = [];
    const matchesToInsert: {
      id: string;
      groupId: string;
      matchType: string;
      scoreType: string;
      status: string;
      team1Id: string;
      team2Id: string;
      team1Player1: string | null;
      team1Player2: string | null;
      team2Player1: string | null;
      team2Player2: string | null;
      team1Score: number | null;
      team2Score: number | null;
      winnerId: string | null;
      matchNumber: number;
      roundNumber: number;
    }[] = [];

    const createdGroupsResult: (Group & { teams: Team[] })[] = [];

    for (let idx = 0; idx < groupsInput.length; idx++) {
      const gi = groupsInput[idx];
      const groupId = crypto.randomUUID();
      const groupRecord = {
        id: groupId,
        tournamentId,
        name: gi.name,
        groupNumber: idx,
      };
      groupsToInsert.push(groupRecord);

      const groupTeams: Team[] = [];
      for (const tInfo of gi.teams) {
        const teamRecord = {
          id: crypto.randomUUID(),
          groupId,
          name: tInfo.name.trim(),
          player1: tInfo.player1?.trim() || null,
          player2: tInfo.player2?.trim() || null,
        };
        teamsToInsert.push(teamRecord);
        groupTeams.push(teamRecord);
      }

      // Generate round-robin matches for group
      let matchNumber = 1;
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          const t1 = groupTeams[i];
          const t2 = groupTeams[j];
          matchesToInsert.push({
            id: crypto.randomUUID(),
            groupId,
            matchType,
            scoreType: 'ELEVEN',
            status: 'PENDING',
            team1Id: t1.id,
            team2Id: t2.id,
            team1Player1: t1.player1 || null,
            team1Player2: matchType === 'DOUBLES' ? (t1.player2 || null) : null,
            team2Player1: t2.player1 || null,
            team2Player2: matchType === 'DOUBLES' ? (t2.player2 || null) : null,
            team1Score: null,
            team2Score: null,
            winnerId: null,
            matchNumber,
            roundNumber: matchNumber,
          });
          matchNumber++;
        }
      }

      createdGroupsResult.push({ ...groupRecord, teams: groupTeams });
    }

    // High-performance batch insertion
    const tournament = await prisma.tournament.create({
      data: {
        id: tournamentId,
        name,
        status: 'GROUP_STAGE',
        matchType,
      },
    });

    if (groupsToInsert.length > 0) {
      await prisma.group.createMany({ data: groupsToInsert });
    }
    if (teamsToInsert.length > 0) {
      await prisma.team.createMany({ data: teamsToInsert });
    }
    if (matchesToInsert.length > 0) {
      await prisma.match.createMany({ data: matchesToInsert });
    }

    return {
      ...tournament,
      createdAt: tournament.createdAt.toISOString(),
      updatedAt: tournament.updatedAt.toISOString(),
      groups: createdGroupsResult,
    };
  },

  async getTournament(id: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        groups: {
          orderBy: { groupNumber: 'asc' },
          include: {
            teams: true,
            matches: {
              orderBy: { matchNumber: 'asc' },
              include: {
                team1: true,
                team2: true,
                winner: true,
              },
            },
          },
        },
        knockoutMatches: {
          include: {
            team1: { include: { group: true } },
            team2: { include: { group: true } },
            winner: true,
          },
        },
      },
    });

    if (!tournament) return null;

    const rOrder: Record<string, number> = { QUARTERFINAL: 0, SEMIFINAL: 1, FINAL: 2 };
    const sortedKnockout = [...tournament.knockoutMatches].sort((a, b) => {
      const diff = (rOrder[a.round] ?? 0) - (rOrder[b.round] ?? 0);
      return diff !== 0 ? diff : a.position - b.position;
    });

    return {
      ...tournament,
      createdAt: tournament.createdAt.toISOString(),
      updatedAt: tournament.updatedAt.toISOString(),
      knockoutMatches: sortedKnockout,
    };
  },

  async deleteTournament(id: string) {
    await prisma.tournament.delete({
      where: { id },
    });
  },

  // ── Matches ──────────────────────────────────────────────────────────────────

  async getMatch(id: string) {
    return await prisma.match.findUnique({
      where: { id },
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
    });
  },

  async updateMatch(id: string, patch: Partial<Match>) {
    const updated = await prisma.match.update({
      where: { id },
      data: {
        ...(patch.matchType !== undefined ? { matchType: patch.matchType } : {}),
        ...(patch.scoreType !== undefined ? { scoreType: patch.scoreType } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.team1Player1 !== undefined ? { team1Player1: patch.team1Player1 } : {}),
        ...(patch.team1Player2 !== undefined ? { team1Player2: patch.team1Player2 } : {}),
        ...(patch.team2Player1 !== undefined ? { team2Player1: patch.team2Player1 } : {}),
        ...(patch.team2Player2 !== undefined ? { team2Player2: patch.team2Player2 } : {}),
        ...(patch.team1Score !== undefined ? { team1Score: patch.team1Score } : {}),
        ...(patch.team2Score !== undefined ? { team2Score: patch.team2Score } : {}),
        ...(patch.winnerId !== undefined ? { winnerId: patch.winnerId } : {}),
      },
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
    });

    // Auto-sync player names back to teams if provided
    if (patch.team1Player1 !== undefined || patch.team1Player2 !== undefined) {
      await prisma.team.update({
        where: { id: updated.team1Id },
        data: {
          ...(patch.team1Player1 !== undefined ? { player1: patch.team1Player1 } : {}),
          ...(patch.team1Player2 !== undefined ? { player2: patch.team1Player2 } : {}),
        },
      });
    }
    if (patch.team2Player1 !== undefined || patch.team2Player2 !== undefined) {
      await prisma.team.update({
        where: { id: updated.team2Id },
        data: {
          ...(patch.team2Player1 !== undefined ? { player1: patch.team2Player1 } : {}),
          ...(patch.team2Player2 !== undefined ? { player2: patch.team2Player2 } : {}),
        },
      });
    }

    return updated;
  },

  // ── Knockout Matches ──────────────────────────────────────────────────────────

  async getKnockoutMatch(id: string) {
    return await prisma.knockoutMatch.findUnique({
      where: { id },
      include: {
        team1: { include: { group: true } },
        team2: { include: { group: true } },
        winner: true,
      },
    });
  },

  async updateKnockoutMatch(id: string, patch: Partial<KnockoutMatch>) {
    const updated = await prisma.knockoutMatch.update({
      where: { id },
      data: {
        ...(patch.team1Id !== undefined ? { team1Id: patch.team1Id } : {}),
        ...(patch.team2Id !== undefined ? { team2Id: patch.team2Id } : {}),
        ...(patch.matchType !== undefined ? { matchType: patch.matchType } : {}),
        ...(patch.scoreType !== undefined ? { scoreType: patch.scoreType } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.team1Player1 !== undefined ? { team1Player1: patch.team1Player1 } : {}),
        ...(patch.team1Player2 !== undefined ? { team1Player2: patch.team1Player2 } : {}),
        ...(patch.team2Player1 !== undefined ? { team2Player1: patch.team2Player1 } : {}),
        ...(patch.team2Player2 !== undefined ? { team2Player2: patch.team2Player2 } : {}),
        ...(patch.team1Score !== undefined ? { team1Score: patch.team1Score } : {}),
        ...(patch.team2Score !== undefined ? { team2Score: patch.team2Score } : {}),
        ...(patch.winnerId !== undefined ? { winnerId: patch.winnerId } : {}),
      },
      include: {
        team1: { include: { group: true } },
        team2: { include: { group: true } },
        winner: true,
      },
    });

    // Auto-sync player names back to teams
    if (updated.team1Id && (patch.team1Player1 !== undefined || patch.team1Player2 !== undefined)) {
      await prisma.team.update({
        where: { id: updated.team1Id },
        data: {
          ...(patch.team1Player1 !== undefined ? { player1: patch.team1Player1 } : {}),
          ...(patch.team1Player2 !== undefined ? { player2: patch.team1Player2 } : {}),
        },
      });
    }
    if (updated.team2Id && (patch.team2Player1 !== undefined || patch.team2Player2 !== undefined)) {
      await prisma.team.update({
        where: { id: updated.team2Id },
        data: {
          ...(patch.team2Player1 !== undefined ? { player1: patch.team2Player1 } : {}),
          ...(patch.team2Player2 !== undefined ? { player2: patch.team2Player2 } : {}),
        },
      });
    }

    return updated;
  },

  async findKnockoutMatch(tournamentId: string, round: KnockoutRound, position: number) {
    return await prisma.knockoutMatch.findFirst({
      where: { tournamentId, round, position },
      include: {
        team1: { include: { group: true } },
        team2: { include: { group: true } },
        winner: true,
      },
    });
  },

  async findKnockoutMatchesByRound(tournamentId: string, round: KnockoutRound) {
    return await prisma.knockoutMatch.findMany({
      where: { tournamentId, round },
      orderBy: { position: 'asc' },
      include: {
        team1: { include: { group: true } },
        team2: { include: { group: true } },
        winner: true,
      },
    });
  },

  async deleteKnockoutMatchesByTournament(tournamentId: string) {
    await prisma.knockoutMatch.deleteMany({
      where: { tournamentId },
    });
  },

  async createKnockoutMatch(km: InputKnockoutMatch) {
    const tournament = await prisma.tournament.findUnique({ where: { id: km.tournamentId } });
    const defaultMatchType = tournament?.matchType || 'DOUBLES';
    const t1 = km.team1Id ? await prisma.team.findUnique({ where: { id: km.team1Id } }) : null;
    const t2 = km.team2Id ? await prisma.team.findUnique({ where: { id: km.team2Id } }) : null;

    return await prisma.knockoutMatch.create({
      data: {
        tournamentId: km.tournamentId,
        round: km.round,
        position: km.position,
        matchType: km.matchType || defaultMatchType,
        scoreType: 'ELEVEN',
        status: 'PENDING',
        team1Id: km.team1Id || null,
        team2Id: km.team2Id || null,
        team1Player1: t1?.player1 || null,
        team1Player2: defaultMatchType === 'DOUBLES' ? (t1?.player2 || null) : null,
        team2Player1: t2?.player1 || null,
        team2Player2: defaultMatchType === 'DOUBLES' ? (t2?.player2 || null) : null,
      },
      include: {
        team1: { include: { group: true } },
        team2: { include: { group: true } },
        winner: true,
      },
    });
  },

  async createKnockoutMatches(kms: InputKnockoutMatch[]) {
    const created = [];
    for (const km of kms) {
      const tournament = await prisma.tournament.findUnique({ where: { id: km.tournamentId } });
      const defaultMatchType = tournament?.matchType || 'DOUBLES';
      const t1 = km.team1Id ? await prisma.team.findUnique({ where: { id: km.team1Id } }) : null;
      const t2 = km.team2Id ? await prisma.team.findUnique({ where: { id: km.team2Id } }) : null;

      const item = await prisma.knockoutMatch.create({
        data: {
          tournamentId: km.tournamentId,
          round: km.round,
          position: km.position,
          matchType: km.matchType || defaultMatchType,
          scoreType: 'ELEVEN',
          status: 'PENDING',
          team1Id: km.team1Id || null,
          team2Id: km.team2Id || null,
          team1Player1: t1?.player1 || null,
          team1Player2: defaultMatchType === 'DOUBLES' ? (t1?.player2 || null) : null,
          team2Player1: t2?.player1 || null,
          team2Player2: defaultMatchType === 'DOUBLES' ? (t2?.player2 || null) : null,
        },
        include: {
          team1: { include: { group: true } },
          team2: { include: { group: true } },
          winner: true,
        },
      });
      created.push(item);
    }
    return created;
  },

  // ── Teams ────────────────────────────────────────────────────────────────────

  async getTeam(id: string) {
    return await prisma.team.findUnique({
      where: { id },
      include: {
        group: true,
      },
    });
  },

  async updateTeam(
    id: string,
    patch: { name?: string; player1?: string | null; player2?: string | null }
  ) {
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.player1 !== undefined ? { player1: patch.player1?.trim() || null } : {}),
        ...(patch.player2 !== undefined ? { player2: patch.player2?.trim() || null } : {}),
      },
    });

    // Synchronize player names across pending matches involving this team
    if (patch.player1 !== undefined || patch.player2 !== undefined) {
      const p1 = patch.player1?.trim() || null;
      const p2 = patch.player2?.trim() || null;

      // Group matches where team is team1
      await prisma.match.updateMany({
        where: { team1Id: id, status: 'PENDING' },
        data: {
          ...(patch.player1 !== undefined ? { team1Player1: p1 } : {}),
          ...(patch.player2 !== undefined ? { team1Player2: p2 } : {}),
        },
      });

      // Group matches where team is team2
      await prisma.match.updateMany({
        where: { team2Id: id, status: 'PENDING' },
        data: {
          ...(patch.player1 !== undefined ? { team2Player1: p1 } : {}),
          ...(patch.player2 !== undefined ? { team2Player2: p2 } : {}),
        },
      });

      // Knockout matches where team is team1
      await prisma.knockoutMatch.updateMany({
        where: { team1Id: id, status: 'PENDING' },
        data: {
          ...(patch.player1 !== undefined ? { team1Player1: p1 } : {}),
          ...(patch.player2 !== undefined ? { team1Player2: p2 } : {}),
        },
      });

      // Knockout matches where team is team2
      await prisma.knockoutMatch.updateMany({
        where: { team2Id: id, status: 'PENDING' },
        data: {
          ...(patch.player1 !== undefined ? { team2Player1: p1 } : {}),
          ...(patch.player2 !== undefined ? { team2Player2: p2 } : {}),
        },
      });
    }

    return updatedTeam;
  },

  // ── Tournament status ─────────────────────────────────────────────────────────

  async updateTournamentStatus(id: string, status: TournamentStatus) {
    await prisma.tournament.update({
      where: { id },
      data: { status },
    });
  },

  async getTournamentForAdvance(id: string) {
    return await prisma.tournament.findUnique({
      where: { id },
      include: {
        groups: {
          orderBy: { groupNumber: 'asc' },
          include: {
            teams: true,
            matches: {
              include: {
                team1: true,
                team2: true,
                winner: true,
              },
            },
          },
        },
      },
    });
  },
};
