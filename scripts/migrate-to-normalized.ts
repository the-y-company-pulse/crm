/**
 * Migration script: Normalize existing Deal data into Company and Contact entities
 *
 * This script:
 * 1. Extracts unique companies from Deal.company (fritext)
 * 2. Extracts unique contacts from Deal.contact (fritext)
 * 3. Matches duplicates aggressively (case-insensitive, trimmed)
 * 4. Creates Company and Contact records
 * 5. Links existing Deals to new entities via companyId and contactId
 *
 * IMPORTANT:
 * - Run this manually with: npx tsx scripts/migrate-to-normalized.ts
 * - Inspect results in Prisma Studio before proceeding
 * - Old fritext fields (company, contact, email, phone) are kept as backup
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Normalize string for duplicate detection
function normalize(str: string | null | undefined): string {
  if (!str) return ""
  return str.trim().toLowerCase()
}

// Extract first and last name from full name
function parseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)

  if (parts.length === 0) {
    return { firstName: "Okänd", lastName: "" }
  } else if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" }
  } else {
    const lastName = parts[parts.length - 1]
    const firstName = parts.slice(0, -1).join(" ")
    return { firstName, lastName }
  }
}

async function main() {
  console.log("🚀 Starting migration to normalized Company and Contact structure...\n")

  // Step 1: Fetch all deals with fritext company/contact
  console.log("📊 Fetching all deals...")
  const deals = await prisma.deal.findMany({
    select: {
      id: true,
      company: true,
      contact: true,
      email: true,
      phone: true,
    },
  })
  console.log(`✓ Found ${deals.length} deals\n`)

  // Step 2: Extract unique companies
  console.log("🏢 Extracting unique companies...")
  const companyMap = new Map<string, {
    originalName: string
    deals: string[]
  }>()

  for (const deal of deals) {
    if (!deal.company) continue

    const normalized = normalize(deal.company)
    if (!normalized) continue

    if (!companyMap.has(normalized)) {
      companyMap.set(normalized, {
        originalName: deal.company.trim(), // Keep original case
        deals: [deal.id]
      })
    } else {
      companyMap.get(normalized)!.deals.push(deal.id)
    }
  }

  console.log(`✓ Found ${companyMap.size} unique companies`)
  console.log("\nCompanies to create:")
  Array.from(companyMap.entries()).forEach(([norm, data]) => {
    console.log(`  • "${data.originalName}" (${data.deals.length} deals)`)
  })

  // Step 3: Create Company records
  console.log("\n💾 Creating Company records...")
  const companyIdMap = new Map<string, string>() // normalized name -> company ID

  for (const [normalized, data] of companyMap.entries()) {
    const company = await prisma.company.create({
      data: {
        name: data.originalName,
        nameNorm: normalized,
      },
    })
    companyIdMap.set(normalized, company.id)
    console.log(`✓ Created: "${company.name}" (${company.id})`)
  }

  // Step 4: Extract unique contacts
  console.log("\n👤 Extracting unique contacts...")
  const contactMap = new Map<string, {
    fullName: string
    companyNorm: string | null
    email: string | null
    phone: string | null
    deals: string[]
  }>()

  for (const deal of deals) {
    if (!deal.contact) continue

    const contactKey = normalize(deal.contact)
    if (!contactKey) continue

    const companyNorm = deal.company ? normalize(deal.company) : null

    // Unique key: contact name + company (same person at different companies = different contacts)
    const uniqueKey = companyNorm ? `${contactKey}@${companyNorm}` : contactKey

    if (!contactMap.has(uniqueKey)) {
      contactMap.set(uniqueKey, {
        fullName: deal.contact.trim(),
        companyNorm,
        email: deal.email?.trim() || null,
        phone: deal.phone?.trim() || null,
        deals: [deal.id],
      })
    } else {
      const existing = contactMap.get(uniqueKey)!
      existing.deals.push(deal.id)

      // Prefer non-null email/phone if we encounter multiple
      if (!existing.email && deal.email) existing.email = deal.email.trim()
      if (!existing.phone && deal.phone) existing.phone = deal.phone.trim()
    }
  }

  console.log(`✓ Found ${contactMap.size} unique contacts`)
  console.log("\nContacts to create:")
  Array.from(contactMap.values()).forEach(data => {
    const company = data.companyNorm ? companyMap.get(data.companyNorm)?.originalName : "Ingen"
    console.log(`  • "${data.fullName}" @ ${company} (${data.deals.length} deals)`)
  })

  // Step 5: Create Contact records
  console.log("\n💾 Creating Contact records...")
  const contactIdMap = new Map<string, string>() // uniqueKey -> contact ID

  for (const [uniqueKey, data] of contactMap.entries()) {
    const { firstName, lastName } = parseName(data.fullName)
    const companyId = data.companyNorm ? companyIdMap.get(data.companyNorm) : null

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        companyId: companyId || null,
      },
    })
    contactIdMap.set(uniqueKey, contact.id)
    console.log(`✓ Created: "${contact.fullName}" (${contact.id})`)
  }

  // Step 6: Link deals to companies and contacts
  console.log("\n🔗 Linking deals to companies and contacts...")
  let linkedDeals = 0

  for (const deal of deals) {
    const updates: any = {}

    // Link to company
    if (deal.company) {
      const normalized = normalize(deal.company)
      const companyId = companyIdMap.get(normalized)
      if (companyId) {
        updates.companyId = companyId
      }
    }

    // Link to contact
    if (deal.contact) {
      const contactKey = normalize(deal.contact)
      const companyNorm = deal.company ? normalize(deal.company) : null
      const uniqueKey = companyNorm ? `${contactKey}@${companyNorm}` : contactKey
      const contactId = contactIdMap.get(uniqueKey)
      if (contactId) {
        updates.contactId = contactId
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.deal.update({
        where: { id: deal.id },
        data: updates,
      })
      linkedDeals++
    }
  }

  console.log(`✓ Linked ${linkedDeals} deals`)

  // Step 7: Summary
  console.log("\n" + "=".repeat(60))
  console.log("✅ Migration complete!")
  console.log("=".repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`  • Companies created: ${companyMap.size}`)
  console.log(`  • Contacts created: ${contactMap.size}`)
  console.log(`  • Deals linked: ${linkedDeals}/${deals.length}`)

  const unlinkedDeals = deals.length - linkedDeals
  if (unlinkedDeals > 0) {
    console.log(`\n⚠️  Warning: ${unlinkedDeals} deals not linked (missing company/contact data)`)
  }

  console.log("\n🔍 Next steps:")
  console.log("  1. Open Prisma Studio: npx prisma studio")
  console.log("  2. Inspect companies, contacts, and deal relations")
  console.log("  3. Verify data looks correct")
  console.log("  4. Old fritext fields (company, contact, email, phone) are kept as backup")
  console.log("  5. When verified, we can remove them in a future migration")
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
