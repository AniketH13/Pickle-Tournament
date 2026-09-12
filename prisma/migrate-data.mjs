import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const dataPath = path.join(process.cwd(), 'data.json');

async function main() {
  if (!fs.existsSync(dataPath)) {
    console.log('No data.json found, skipping migration.');
    return;
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log(`Found ${data.tournaments?.length || 0} tournaments to migrate.`);

  for (const t of data.tournaments || []) {
    await prisma.tournament.upsert({
      where: { id: t.id },
      update: {
        name: t.name,
        status: t.status || 'GROUP_STAGE',
        matchType: t.matchType || 'DOUBLES',
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      },
      create: {
        id: t.id,
        name: t.name,
        status: t.status || 'GROUP_STAGE',
        matchType: t.matchType || 'DOUBLES',
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      },
    });
  }

  for (const g of data.groups || []) {
    await prisma.group.upsert({
      where: { id: g.id },
      update: {
        tournamentId: g.tournamentId,
        name: g.name,
        groupNumber: g.groupNumber,
      },
      create: {
        id: g.id,
        tournamentId: g.tournamentId,
        name: g.name,
        groupNumber: g.groupNumber,
      },
    });
  }

  for (const tm of data.teams || []) {
    await prisma.team.upsert({
      where: { id: tm.id },
      update: {
        groupId: tm.groupId,
        name: tm.name,
        player1: tm.player1 || null,
        player2: tm.player2 || null,
      },
      create: {
        id: tm.id,
        groupId: tm.groupId,
        name: tm.name,
        player1: tm.player1 || null,
        player2: tm.player2 || null,
      },
    });
  }

  for (const m of data.matches || []) {
    await prisma.match.upsert({
      where: { id: m.id },
      update: {
        groupId: m.groupId,
        matchType: m.matchType || 'SINGLES',
        scoreType: m.scoreType || 'ELEVEN',
        status: m.status || 'PENDING',
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        team1Player1: m.team1Player1 || null,
        team1Player2: m.team1Player2 || null,
        team2Player1: m.team2Player1 || null,
        team2Player2: m.team2Player2 || null,
        team1Score: m.team1Score !== undefined ? m.team1Score : null,
        team2Score: m.team2Score !== undefined ? m.team2Score : null,
        winnerId: m.winnerId || null,
        matchNumber: m.matchNumber,
        roundNumber: m.roundNumber,
      },
      create: {
        id: m.id,
        groupId: m.groupId,
        matchType: m.matchType || 'SINGLES',
        scoreType: m.scoreType || 'ELEVEN',
        status: m.status || 'PENDING',
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        team1Player1: m.team1Player1 || null,
        team1Player2: m.team1Player2 || null,
        team2Player1: m.team2Player1 || null,
        team2Player2: m.team2Player2 || null,
        team1Score: m.team1Score !== undefined ? m.team1Score : null,
        team2Score: m.team2Score !== undefined ? m.team2Score : null,
        winnerId: m.winnerId || null,
        matchNumber: m.matchNumber,
        roundNumber: m.roundNumber,
      },
    });
  }

  for (const km of data.knockoutMatches || []) {
    await prisma.knockoutMatch.upsert({
      where: { id: km.id },
      update: {
        tournamentId: km.tournamentId,
        round: km.round,
        position: km.position,
        matchType: km.matchType || 'SINGLES',
        scoreType: km.scoreType || 'ELEVEN',
        status: km.status || 'PENDING',
        team1Id: km.team1Id || null,
        team2Id: km.team2Id || null,
        team1Player1: km.team1Player1 || null,
        team1Player2: km.team1Player2 || null,
        team2Player1: km.team2Player1 || null,
        team2Player2: km.team2Player2 || null,
        team1Score: km.team1Score !== undefined ? km.team1Score : null,
        team2Score: km.team2Score !== undefined ? km.team2Score : null,
        winnerId: km.winnerId || null,
      },
      create: {
        id: km.id,
        tournamentId: km.tournamentId,
        round: km.round,
        position: km.position,
        matchType: km.matchType || 'SINGLES',
        scoreType: km.scoreType || 'ELEVEN',
        status: km.status || 'PENDING',
        team1Id: km.team1Id || null,
        team2Id: km.team2Id || null,
        team1Player1: km.team1Player1 || null,
        team1Player2: km.team1Player2 || null,
        team2Player1: km.team2Player1 || null,
        team2Player2: km.team2Player2 || null,
        team1Score: km.team1Score !== undefined ? km.team1Score : null,
        team2Score: km.team2Score !== undefined ? km.team2Score : null,
        winnerId: km.winnerId || null,
      },
    });
  }

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
