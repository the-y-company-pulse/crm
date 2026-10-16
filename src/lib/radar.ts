// Kulturradarn — prospecting signals.
//
// The weekly harvest only INSERTs raw rows into `radar_inbox`. processRadarInbox()
// turns each unprocessed row into Company / Contact / Signal records:
//   - Company matched on orgNr, then exact nameNorm, then a looser matchKey
//     (legal suffixes and parentheses stripped). New signals for an existing
//     company are added to it, never a duplicate company.
//   - Existing company/contact fields are only filled when blank.
//   - Signal status is never written here — it is set by humans only.
import { prisma } from "./prisma"
import type { Prisma, RadarInbox } from "@prisma/client"

export {
  RADAR_SIGNAL_TYPES,
  RADAR_STATUSES,
  RADAR_STRENGTHS,
  RADAR_REGIONS,
  RADAR_TARGET_REGIONS,
  STRENGTH_RANK,
  type RadarStatus,
} from "./radar-constants"
import { RADAR_SIGNAL_TYPES, RADAR_STRENGTHS, RADAR_REGIONS } from "./radar-constants"

// Same normalisation as the rest of the CRM (companies.nameNorm)
export function nameNorm(name: string) {
  return name.trim().toLowerCase()
}

// Looser key for matching radar names against existing companies:
// "Nelly Group" ~ "Nelly", "Castra AB" ~ "Castra", "Enqore (Two + Absfront)" ~ "Enqore"
export function matchKey(name: string) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[.,&/]/g, " ")
    .replace(/\b(ab|publ|group|gruppen|koncernen|holding|sverige|sweden|i sverige|aktiebolag)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// "5591048243" / "559104-8243" → "559104-8243"; anything else → null
export function normalizeOrgNr(raw: string | null | undefined) {
  const digits = (raw ?? "").replace(/\D/g, "")
  if (digits.length === 12) return `${digits.slice(2, 8)}-${digits.slice(8)}` // 16XXXXXX-XXXX
  if (digits.length === 10) return `${digits.slice(0, 6)}-${digits.slice(6)}`
  return null
}

// Empty, "okänt", "okänd", "Ort okänd" → null
export function clean(value: string | null | undefined) {
  const v = (value ?? "").trim()
  if (!v) return null
  if (/^(okänd|okänt|ort okänd|-|—)$/i.test(v)) return null
  return v
}

// "268" → 268, "ca 70" → 70, "350+" → 350; ranges/uncertain text → null
export function parseEmployees(raw: string | null | undefined) {
  const v = clean(raw)
  if (!v) return null
  const m = v.match(/^(?:ca\.?\s*)?(\d+)\+?$/i)
  return m ? parseInt(m[1], 10) : null
}

function oneOf<T extends readonly string[]>(list: T, value: string | null | undefined): T[number] | null {
  const v = (value ?? "").trim()
  return (list as readonly string[]).includes(v) ? (v as T[number]) : null
}

function gapScore(n: number | null | undefined) {
  return n != null && n >= 1 && n <= 3 ? n : null
}

// Personal address = local part mentions the contact's first or last name.
// Otherwise (info@, press@, ir@ …) it is the company's general address.
function isPersonalEmail(email: string, contactName: string | null) {
  if (!contactName) return false
  const local = email.split("@")[0].toLowerCase()
  const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  return contactName
    .split(/\s+/)
    .map(fold)
    .filter((p) => p.length >= 3)
    .some((p) => fold(local).includes(p))
}

// "Simon Röcklinger (ej bekräftad)" → { name: "Simon Röcklinger", note: "ej bekräftad" }
function parseContactName(raw: string | null | undefined) {
  const v = clean(raw)
  if (!v) return null
  const note = v.match(/\(([^)]*)\)/)?.[1]?.trim() || null
  const name = v.replace(/\(.*?\)/g, "").trim()
  return name ? { name, note } : null
}

function appendNote(existing: string | null, line: string) {
  if (!line) return existing
  if (existing?.includes(line)) return existing
  return existing ? `${existing}\n${line}` : line
}

type Tx = Prisma.TransactionClient

async function findCompany(tx: Tx, row: RadarInbox) {
  const orgNr = normalizeOrgNr(row.orgnr)
  if (orgNr) {
    const byOrg = await tx.company.findUnique({ where: { orgNr } })
    if (byOrg) return byOrg
  }
  const byName = await tx.company.findUnique({ where: { nameNorm: nameNorm(row.bolag) } })
  if (byName) return byName

  const key = matchKey(row.bolag)
  if (!key) return null
  const candidates = await tx.company.findMany({
    where: { nameNorm: { contains: key.split(" ")[0] } },
  })
  const hits = candidates.filter((c) => matchKey(c.name) === key)
  // Only accept an unambiguous loose match
  return hits.length === 1 ? hits[0] : null
}

async function upsertCompany(tx: Tx, row: RadarInbox) {
  const orgNr = normalizeOrgNr(row.orgnr)
  const employees = parseEmployees(row.anstallda)
  const employeesNote = clean(row.anstallda)
  const contact = parseContactName(row.kontakt)
  const epost = clean(row.epost)
  const generalEmail = epost && !isPersonalEmail(epost, contact?.name ?? null) ? epost : null
  const region = oneOf(RADAR_REGIONS, row.region)
  const ambition = gapScore(row.ambition)
  const drive = gapScore(row.drivkraft)

  const fields = {
    orgNr,
    industry: clean(row.bransch),
    city: clean(row.ort),
    region,
    employees,
    employeesNote: employees != null && String(employees) === employeesNote ? null : employeesNote,
    switchboard: clean(row.vaxel),
    email: generalEmail,
    emailPattern: clean(row.epostMonster),
  }

  const existing = await findCompany(tx, row)
  if (!existing) {
    return tx.company.create({
      data: {
        name: row.bolag.trim(),
        nameNorm: nameNorm(row.bolag),
        ...fields,
        gapAmbition: ambition,
        gapDrive: drive,
        gapRationale: clean(row.glappMotivering),
        gapAssessedAt: ambition || drive ? new Date() : null,
      },
    })
  }

  // Fill blanks only — never overwrite what a human has entered
  const update: Prisma.CompanyUpdateInput = {}
  for (const [k, v] of Object.entries(fields) as [keyof typeof fields, string | number | null][]) {
    if (v != null && (existing[k] == null || existing[k] === "")) (update as any)[k] = v
  }
  // "Okänd" region may be upgraded to a known one
  if (region && region !== "Okänd" && existing.region === "Okänd") update.region = region
  if (existing.gapAmbition == null && existing.gapDrive == null && (ambition || drive)) {
    update.gapAmbition = ambition
    update.gapDrive = drive
    update.gapRationale = clean(row.glappMotivering)
    update.gapAssessedAt = new Date()
  }
  if (Object.keys(update).length === 0) return existing
  return tx.company.update({ where: { id: existing.id }, data: update })
}

async function upsertContact(tx: Tx, row: RadarInbox, companyId: string) {
  const parsed = parseContactName(row.kontakt)
  const comment = [parsed?.note, clean(row.kontaktKommentar)].filter(Boolean).join(" · ")

  if (!parsed) {
    // No named person — keep the comment on the company so it isn't lost
    if (comment) {
      const c = await tx.company.findUniqueOrThrow({ where: { id: companyId } })
      await tx.company.update({
        where: { id: companyId },
        data: { notes: appendNote(c.notes, `Radar (kontakt): ${comment}`) },
      })
    }
    return null
  }

  const epost = clean(row.epost)
  const personalEmail = epost && isPersonalEmail(epost, parsed.name) ? epost : null
  const fields = {
    title: clean(row.kontaktRoll),
    phone: clean(row.telefon),
    email: personalEmail,
    sourceUrl: clean(row.kontaktKalla),
  }

  const existing = await tx.contact.findFirst({
    where: { companyId, fullName: { equals: parsed.name, mode: "insensitive" } },
  })
  if (!existing) {
    const parts = parsed.name.split(/\s+/)
    return tx.contact.create({
      data: {
        firstName: parts.length === 1 ? parts[0] : parts.slice(0, -1).join(" "),
        lastName: parts.length > 1 ? parts[parts.length - 1] : "",
        fullName: parsed.name,
        companyId,
        ...fields,
        notes: comment || null,
      },
    })
  }

  const update: Prisma.ContactUpdateInput = {}
  for (const [k, v] of Object.entries(fields) as [keyof typeof fields, string | null][]) {
    if (v && !existing[k]) (update as any)[k] = v
  }
  const notes = appendNote(existing.notes, comment)
  if (notes !== existing.notes) update.notes = notes
  if (Object.keys(update).length === 0) return existing
  return tx.contact.update({ where: { id: existing.id }, data: update })
}

async function processRow(row: RadarInbox) {
  const type = oneOf(RADAR_SIGNAL_TYPES, row.typ)
  if (!type) throw new Error(`Okänd signaltyp: "${row.typ}"`)
  if (!row.bolag?.trim()) throw new Error("Bolagsnamn saknas")
  if (!row.signal?.trim()) throw new Error("Signaltext saknas")

  await prisma.$transaction(async (tx) => {
    const company = await upsertCompany(tx, row)
    await upsertContact(tx, row, company.id)

    const sourceUrl = clean(row.url)
    // Same company + type + source = the same event re-reported: refresh the
    // text only (status is never touched).
    const duplicate = sourceUrl
      ? await tx.signal.findFirst({ where: { companyId: company.id, type, sourceUrl } })
      : null

    if (duplicate) {
      await tx.signal.update({
        where: { id: duplicate.id },
        data: { summary: row.signal.trim() },
      })
    } else {
      await tx.signal.create({
        data: {
          companyId: company.id,
          type,
          summary: row.signal.trim(),
          eventDate: clean(row.datum),
          sourceName: clean(row.kalla),
          sourceUrl,
          strength: oneOf(RADAR_STRENGTHS, row.styrka),
          angle: clean(row.vinkel),
          inboxId: row.id,
        },
      })
    }

    await tx.radarInbox.update({
      where: { id: row.id },
      data: { processedAt: new Date(), processError: null },
    })
  })
}

// Processes all pending inbox rows. Safe to call concurrently: signals.inboxId
// is unique, so a row processed twice fails its second transaction harmlessly.
export async function processRadarInbox() {
  const pending = await prisma.radarInbox.findMany({
    where: { processedAt: null, processError: null },
    orderBy: { createdAt: "asc" },
  })
  const result = { processed: 0, failed: [] as { bolag: string; error: string }[] }
  for (const row of pending) {
    try {
      await processRow(row)
      result.processed++
    } catch (e: any) {
      const already = e?.code === "P2002" && (await prisma.signal.findUnique({ where: { inboxId: row.id } }))
      if (already) continue
      const message = e?.message?.split("\n").pop()?.slice(0, 500) ?? String(e)
      await prisma.radarInbox.update({ where: { id: row.id }, data: { processError: message } })
      result.failed.push({ bolag: row.bolag, error: message })
    }
  }
  return result
}

// Overall prospect status for a company, derived from its signals and deals
export function prospectStatus(
  signals: { status: string }[],
  deals: { status: string }[]
): string {
  if (deals.some((d) => d.status === "won")) return "Kund"
  if (deals.some((d) => d.status === "open")) return "I pipeline"
  for (const s of ["Ny", "Kontaktad", "Bevaka"]) {
    if (signals.some((x) => x.status === s)) return s
  }
  return signals.length ? "Ej relevant" : "—"
}
