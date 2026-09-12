import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  console.log('✅ Connection test: SUCCESS');
  const counts = {
    tournaments: await prisma.tournament.count(),
    groups: await prisma.group.count(),
    teams: await prisma.team.count(),
    matches: await prisma.match.count(),
    knockoutMatches: await prisma.knockoutMatch.count(),
  };
  console.log('Database Records:', counts);
  const sample = await prisma.tournament.findFirst({
    select: { id: true, name: true, status: true, matchType: true }
  });
  console.log('Active Tournament:', sample);
}

main()
  .catch((e) => {
    console.error('❌ Connection test: FAILED', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
