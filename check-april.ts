import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const aprilDeals = await prisma.deal.findMany({
    where: {
      status: 'won',
      wonAt: {
        gte: new Date('2026-04-01'),
        lt: new Date('2026-05-01')
      }
    },
    select: {
      title: true,
      company: true,
      value: true,
      wonAt: true,
      sourceId: true
    },
    orderBy: { value: 'desc' }
  })

  console.log(`\n✓ Affärer vunna i april 2026: ${aprilDeals.length} st\n`)

  let total = 0
  aprilDeals.forEach(deal => {
    total += deal.value
    console.log(`${deal.wonAt?.toISOString().split('T')[0]} - ${deal.title} (${deal.company}) - ${deal.value.toLocaleString('sv-SE')} kr`)
  })

  console.log(`\n✓ Totalt: ${total.toLocaleString('sv-SE')} kr\n`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
