// Fill in company websites for radar companies that lack one.
//
//   npx tsx scripts/backfill-websites.ts [--map websites.json] [--dry-run]
//
// 1. Guesses from source URLs already stored (contact source, signal source)
//    when the domain resembles the company name.
// 2. --map: a JSON object { "<company name>": "https://..." } of verified
//    websites for the rest.
// Never overwrites a website that is already set.
import { readFileSync } from "fs"
import { PrismaClient } from "@prisma/client"
import { guessWebsite, normalizeWebsite } from "../src/lib/radar"

const prisma = new PrismaClient()

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const mapIdx = process.argv.indexOf("--map")
  const map: Record<string, string> = mapIdx > 0 ? JSON.parse(readFileSync(process.argv[mapIdx + 1], "utf8")) : {}

  const companies = await prisma.company.findMany({
    where: { website: null, signals: { some: {} } },
    select: {
      id: true,
      name: true,
      contacts: { select: { sourceUrl: true } },
      signals: { select: { sourceUrl: true } },
    },
    orderBy: { name: "asc" },
  })

  const missing: string[] = []
  let updated = 0
  for (const c of companies) {
    const website =
      normalizeWebsite(map[c.name]) ??
      guessWebsite([...c.contacts.map((x) => x.sourceUrl), ...c.signals.map((x) => x.sourceUrl)], c.name)
    if (!website) {
      missing.push(c.name)
      continue
    }
    console.log(`  ${c.name} → ${website}`)
    if (!dryRun) await prisma.company.update({ where: { id: c.id }, data: { website } })
    updated++
  }
  console.log(`${updated} ${dryRun ? "skulle uppdateras" : "uppdaterade"}, ${missing.length} saknar fortfarande webbplats`)
  if (missing.length) console.log(JSON.stringify(missing))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
