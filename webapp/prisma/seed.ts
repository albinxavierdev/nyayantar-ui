import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

async function main() {
  // Upsert admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nyayantar.com' },
    update: {},
    create: {
      email: 'admin@nyayantar.com',
      name: 'Admin',
      passwordHash: hashPassword('admin123'),
      role: 'ADMIN',
    },
  })
  console.log(`✓ Admin user: ${admin.email} (${admin.id})`)

  // Upsert dummy user
  const user = await prisma.user.upsert({
    where: { email: 'user@nyayantar.com' },
    update: {},
    create: {
      email: 'user@nyayantar.com',
      name: 'User',
      passwordHash: hashPassword('user123'),
      role: 'USER',
    },
  })
  console.log(`✓ Dummy user: ${user.email} (${user.id})`)

  console.log('\nDone! Users seeded successfully.')
  console.log('\nCredentials:')
  console.log('  Admin → admin@nyayantar.com / admin123')
  console.log('  User  → user@nyayantar.com / user123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
