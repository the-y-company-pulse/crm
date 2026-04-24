/**
 * Fix duplicate companies by merging them
 *
 * This script:
 * 1. Merges "Adrian Group AB" (typo) into "Aderian Group AB"
 * 2. Merges "Erik Olsson" into "Erik Olsson AB"
 * 3. Merges "NVB AB" into "NVB Nordisk Vattenbildning AB"
 * 4. Updates all related deals and contacts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔧 Fixing duplicate companies...\n")

  // 1. Adrian Group AB (typo) → Aderian Group AB
  await mergeDuplicate(
    "adrian group ab",
    "aderian group ab",
    "Adrian Group AB (stavfel)",
    "Aderian Group AB"
  )

  // 2. Erik Olsson → Erik Olsson AB
  await mergeDuplicate(
    "erik olsson",
    "erik olsson ab",
    "Erik Olsson",
    "Erik Olsson AB"
  )

  // 3. NVB AB → NVB Nordisk Vattenbildning AB
  await mergeDuplicate(
    "nvb ab",
    "nvb nordisk vattenbildning ab",
    "NVB AB",
    "NVB Nordisk Vattenbildning AB"
  )

  console.log("\n✅ All duplicates merged!")
}

async function mergeDuplicate(
  fromNorm: string,
  toNorm: string,
  fromName: string,
  toName: string
) {
  // Find the companies
  const fromCompany = await prisma.company.findUnique({
    where: { nameNorm: fromNorm },
  })
  const toCompany = await prisma.company.findUnique({
    where: { nameNorm: toNorm },
  })

  if (!fromCompany) {
    console.log(`⚠️  "${fromName}" not found, skipping...`)
    return
  }

  if (!toCompany) {
    console.log(`⚠️  "${toName}" not found, skipping...`)
    return
  }

  console.log(`📝 Merging "${fromName}" → "${toName}"`)

  // Update all deals pointing to the duplicate
  const dealsUpdated = await prisma.deal.updateMany({
    where: { companyId: fromCompany.id },
    data: { companyId: toCompany.id },
  })
  console.log(`   ✓ Updated ${dealsUpdated.count} deals`)

  // Update all contacts pointing to the duplicate
  const contactsUpdated = await prisma.contact.updateMany({
    where: { companyId: fromCompany.id },
    data: { companyId: toCompany.id },
  })
  console.log(`   ✓ Updated ${contactsUpdated.count} contacts`)

  // Delete the duplicate company
  await prisma.company.delete({
    where: { id: fromCompany.id },
  })
  console.log(`   ✓ Deleted duplicate company\n`)
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
