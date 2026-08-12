import { db } from '../src/client'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Seeding DB users...')

  const hash = await bcrypt.hash('password123', 12)

  // 1. Seed Demo Learner
  const demo = await db.user.upsert({
    where: { email: 'demo@codetrainer.dev' },
    update: {},
    create: {
      email: 'demo@codetrainer.dev',
      passwordHash: hash,
      displayName: 'Demo Learner',
      role: 'LEARNER',
      isVerified: true,
    },
  })

  // 2. Seed Admin User
  const admin = await db.user.upsert({
    where: { email: 'admin@codetrainer.dev' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@codetrainer.dev',
      passwordHash: hash,
      displayName: 'System Admin',
      role: 'ADMIN',
      isVerified: true,
    },
  })

  // 3. Seed Content Editor User
  const editor = await db.user.upsert({
    where: { email: 'editor@codetrainer.dev' },
    update: { role: 'CONTENT_EDITOR' },
    create: {
      email: 'editor@codetrainer.dev',
      passwordHash: hash,
      displayName: 'Content Editor',
      role: 'CONTENT_EDITOR',
      isVerified: true,
    },
  })

  // Demo progress state
  await db.progress.upsert({
    where: { userId_challengeId: { userId: demo.id, challengeId: 'js-print-text-001' } },
    update: {},
    create: {
      userId: demo.id,
      challengeId: 'js-print-text-001',
      status: 'COMPLETED',
      attemptCount: 1,
      xpAwarded: 15,
      completedAt: new Date(),
    },
  })

  await db.xPEvent.upsert({
    where: { id: 'seed-xp-1' },
    update: {},
    create: {
      id: 'seed-xp-1',
      userId: demo.id,
      type: 'CHALLENGE_COMPLETE',
      amount: 15,
      challengeId: 'js-print-text-001',
    },
  })

  await db.masteryRecord.upsert({
    where: { userId_skillId: { userId: demo.id, skillId: 'javascript.output' } },
    update: {},
    create: {
      userId: demo.id,
      skillId: 'javascript.output',
      masteryScore: 0.3,
      evidenceCount: 1,
    },
  })

  console.log(`✓ Demo Learner: ${demo.email} / password123`)
  console.log(`✓ Admin User:   ${admin.email} / password123`)
  console.log(`✓ Editor User:  ${editor.email} / password123`)
  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
