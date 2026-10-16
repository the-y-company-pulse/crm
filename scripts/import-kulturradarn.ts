// One-off import of the Kulturradarn export (claude.ai artifact) into the CRM.
//
//   npx tsx scripts/import-kulturradarn.ts <path/to/kulturradarn-export.json> [--dry-run]
//
// Rows go through the same path as the weekly harvest: inserted into
// radar_inbox, then processed into Company / Contact / Signal. Status set in
// the artifact is carried over (the import is a human decision, not automation).
// Re-running is safe: slugs already in the inbox are skipped.
import { readFileSync } from "fs"
import { PrismaClient } from "@prisma/client"
import { processRadarInbox, nameNorm, matchKey } from "../src/lib/radar"
import { RADAR_STATUSES } from "../src/lib/radar-constants"

const prisma = new PrismaClient()

type ExportRow = Record<string, string>

async function main() {
  const [path] = process.argv.slice(2).filter((a) => !a.startsWith("--"))
  const dryRun = process.argv.includes("--dry-run")
  if (!path) throw new Error("Usage: import-kulturradarn.ts <export.json> [--dry-run]")

  const rows: ExportRow[] = JSON.parse(readFileSync(path, "utf8"))
  console.log(`${rows.length} rader i exporten`)

  const companies = await prisma.company.findMany({ select: { id: true, name: true, nameNorm: true } })
  for (const r of rows) {
    const exact = companies.find((c) => c.nameNorm === nameNorm(r.bolag))
    const loose = exact ? null : companies.filter((c) => matchKey(c.name) === matchKey(r.bolag))
    if (exact) console.log(`  befintligt: ${r.bolag}`)
    else if (loose && loose.length === 1) console.log(`  befintligt (lös match): ${r.bolag} → ${loose[0].name}`)
    else if (loose && loose.length > 1) console.log(`  OSÄKER (${loose.length} träffar, skapas som nytt): ${r.bolag}`)
  }
  if (dryRun) return

  const existingSlugs = new Set(
    (await prisma.radarInbox.findMany({ select: { slug: true } })).map((r) => r.slug)
  )
  const fresh = rows.filter((r) => !existingSlugs.has(r.id))
  console.log(`${fresh.length} nya rader läggs i radar_inbox (${rows.length - fresh.length} redan importerade)`)

  await prisma.radarInbox.createMany({
    data: fresh.map((r) => ({
      slug: r.id,
      typ: r.typ,
      bolag: r.bolag,
      ort: r.ort,
      bransch: r.bransch,
      region: r.region,
      anstallda: r.anstallda,
      signal: r.signal,
      datum: r.datum,
      kalla: r.kalla,
      url: r.url,
      styrka: r.styrka,
      vinkel: r.vinkel,
      kontakt: r.kontakt,
      kontaktRoll: r.kontakt_roll,
      telefon: r.telefon,
      vaxel: r.vaxel,
      epost: r.epost,
      epostMonster: r.epost_monster,
      kontaktKalla: r.kontakt_kalla,
      kontaktKommentar: r.kontakt_kommentar,
      tillagd: r.tillagd,
      createdAt: r.tillagd ? new Date(`${r.tillagd}T12:00:00Z`) : undefined,
    })),
  })

  const result = await processRadarInbox()
  console.log(`Bearbetade: ${result.processed}`)
  for (const f of result.failed) console.log(`  FEL ${f.bolag}: ${f.error}`)

  // Carry over human-set status and the original "tillagd" date
  for (const r of fresh) {
    const signal = await prisma.signal.findFirst({ where: { inbox: { slug: r.id } } })
    if (!signal) continue
    const status = (RADAR_STATUSES as readonly string[]).includes(r.status) ? r.status : "Ny"
    await prisma.signal.update({
      where: { id: signal.id },
      data: {
        status,
        createdAt: r.tillagd ? new Date(`${r.tillagd}T12:00:00Z`) : undefined,
      },
    })
  }

  console.log(
    `Totalt: ${await prisma.signal.count()} signaler, ${await prisma.company.count()} företag, ${await prisma.contact.count()} kontakter`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
