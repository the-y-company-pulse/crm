import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Count won deals
  const wonCount = await prisma.deal.count({
    where: { wonAt: { not: null } }
  })
  console.log(`✓ Vunna deals: ${wonCount}`)

  // Sum value for won deals in 2026
  const won2026 = await prisma.deal.aggregate({
    where: {
      status: 'won',
      wonAt: {
        gte: new Date('2026-01-01'),
        lt: new Date('2027-01-01')
      }
    },
    _sum: { value: true }
  })
  const value2026 = won2026._sum.value || 0
  console.log(`✓ Värde vunna 2026: ${value2026.toLocaleString('sv-SE')} kr`)

  // Sum value for won deals in 2025
  const won2025 = await prisma.deal.aggregate({
    where: {
      status: 'won',
      wonAt: {
        gte: new Date('2025-01-01'),
        lt: new Date('2026-01-01')
      }
    },
    _sum: { value: true }
  })
  const value2025 = won2025._sum.value || 0
  console.log(`✓ Värde vunna 2025: ${value2025.toLocaleString('sv-SE')} kr`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
