// Import Ledarskapsradarn candidates (JSON arrays of inbox rows) via radar_inbox.
//
//   npx tsx scripts/import-ledarskap.ts <file.json> [more.json ...] [--dry-run]
//
// --dry-run prints how each candidate scores against the program profile and
// which existing companies it would merge into, without writing anything.
import { readFileSync } from "fs"
import { PrismaClient } from "@prisma/client"
import { processRadarInbox, nameNorm, matchKey } from "../src/lib/radar"
import { evaluateFit } from "../src/lib/radar-fit"
import { distanceFromGoteborgKm } from "../src/lib/geo"

const prisma = new PrismaClient()

type Candidate = Record<string, string | number | null>

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

function region(ort: string | null) {
  const d = distanceFromGoteborgKm(ort)
  if (d == null) return "Okänd"
  return /kungsbacka|varberg|falkenberg|halmstad|laholm|hyltebruk|onsala|frillesås|veddige/i.test(ort ?? "")
    ? "Halland"
    : "Västra Götaland"
}

async function main() {
  const files = process.argv.slice(2).filter((a) => !a.startsWith("--"))
  const dryRun = process.argv.includes("--dry-run")
  const rows: Candidate[] = files.flatMap((f) => JSON.parse(readFileSync(f, "utf8")))

  // De-duplicate across files on org.nr / name
  const seen = new Set<string>()
  const unique = rows.filter((r) => {
    const key = str(r.orgnr) ?? nameNorm(String(r.bolag))
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  console.log(`${rows.length} kandidater, ${unique.length} unika`)

  const companies = await prisma.company.findMany({ select: { name: true, nameNorm: true, orgNr: true } })
  for (const r of unique) {
    const employees = Number(String(r.anstallda ?? "").replace(/\D/g, "")) || null
    const fit = evaluateFit({
      city: str(r.ort), region: region(str(r.ort)), distanceKm: null, employees, managers: null,
      revenueMsek: num(r.omsattningMsek), operatingProfitMsek: num(r.rorelseresultatMsek),
      operatingProfitPrevMsek: num(r.rorelseresultatFgMsek), operatingMarginPct: null,
      equityRatioPct: num(r.soliditet), quickRatioPct: num(r.kassalikviditet), fiscalYear: num(r.bokslutsar),
    })
    const marks = fit.map((f) => `${f.state === "ok" ? "✓" : f.state === "no" ? "✕" : "?"}${f.label}`).join(" ")
    const existing = companies.find(
      (c) => (r.orgnr && c.orgNr === r.orgnr) || c.nameNorm === nameNorm(String(r.bolag)) || matchKey(c.name) === matchKey(String(r.bolag))
    )
    console.log(`  ${r.bolag} (${r.ort}) ${marks}${existing ? `  [finns: ${existing.name}]` : ""}`)
  }
  if (dryRun) return

  await prisma.radarInbox.createMany({
    data: unique.map((r) => ({
      radar: "ledarskap",
      typ: str(r.typ) ?? "Passar profilen",
      bolag: String(r.bolag).trim(),
      slug: nameNorm(String(r.bolag)).replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      orgnr: str(r.orgnr),
      ort: str(r.ort),
      region: region(str(r.ort)),
      bransch: str(r.bransch),
      anstallda: str(r.anstallda),
      signal: String(r.signal).trim(),
      vinkel: str(r.vinkel),
      kalla: str(r.kalla),
      url: str(r.url),
      bokslutsar: num(r.bokslutsar),
      omsattningMsek: num(r.omsattningMsek),
      rorelseresultatMsek: num(r.rorelseresultatMsek),
      rorelseresultatFgMsek: num(r.rorelseresultatFgMsek),
      soliditet: num(r.soliditet),
      kassalikviditet: num(r.kassalikviditet),
      kontakt: str(r.kontakt),
      kontaktRoll: str(r.kontaktRoll),
      telefon: str(r.telefon),
      vaxel: str(r.vaxel),
      epost: str(r.epost),
      kontaktKalla: str(r.kontaktKalla),
      kontaktKommentar: str(r.kontaktKommentar),
      tillagd: new Date().toISOString().slice(0, 10),
    })),
  })

  const result = await processRadarInbox()
  console.log(`Bearbetade: ${result.processed}`)
  for (const f of result.failed) console.log(`  FEL ${f.bolag}: ${f.error}`)
  console.log(`Ledarskapsradarn: ${await prisma.signal.count({ where: { radar: "ledarskap" } })} signaler`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
