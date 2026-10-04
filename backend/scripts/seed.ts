import { prisma, checkDatabaseConnection } from '../src/db/prisma.js';
import bcrypt from 'bcryptjs';

async function seed() {
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    console.info('[Seed] PostgreSQL is unavailable; no persistent data was seeded. The API initializes separate process-local demo data on startup.');
    return;
  }

  console.log('[Seed] Seeding the PostgreSQL demo account via Prisma...');
  try {
    const demoEmail = 'alex@creatorai.studio';
    const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });

    if (!existingUser) {
      const passwordHash = await bcrypt.hash('Password123!', 8);
      const user = await prisma.user.create({
        data: {
          email: demoEmail,
          passwordHash,
          name: 'Alex Rivera',
          role: 'creator',
          profile: {
            create: {
              channelName: 'The AI Studio',
              niche: 'AI & Creative Operations',
              bio: 'Deep dives on engineering creative production pipelines, non-destructive video editing, and modern creator intelligence.',
              primaryPlatform: 'youtube',
            },
          },
        },
      });
      console.log(`[Seed] Created PostgreSQL demo user: ${user.email} (${user.id})`);
    } else {
      console.log(`[Seed] Demo user already exists: ${existingUser.email}`);
    }
  } catch (error) {
    console.error('[Seed] PostgreSQL demo seeding failed.', error);
    throw error;
  }

  console.log('[Seed] PostgreSQL demo seed completed successfully.');
  console.log('Demo login credentials:');
  console.log('Email: alex@creatorai.studio');
  console.log('Password: Password123!');
}

seed().catch((error) => {
  console.error('[Seed] Seed command failed.', error);
  process.exitCode = 1;
});
