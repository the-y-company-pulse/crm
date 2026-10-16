import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { processRadarInbox } from "@/lib/radar"
import { RADARS } from "@/lib/radar-constants"

const opt = z.string().trim().nullable().optional()

const num = z.number().finite().nullable().optional()
const int = z.number().int().nullable().optional()

const InboxRowSchema = z.object({
  radar: z.enum(["kultur", "skraddarsytt", "ledarskap"]).default("kultur"),
  bolag: z.string().trim().min(1, "Bolag saknas"),
  typ: z.string().trim().min(1),
  signal: z.string().trim().min(1, "Signaltext saknas"),
  orgnr: opt,
  ort: opt,
  bransch: opt,
  webbplats: opt,
  region: opt,
  anstallda: opt,
  datum: opt,
  kalla: opt,
  url: opt,
  styrka: opt,
  vinkel: opt,
  kontakt: opt,
  kontaktRoll: opt,
  telefon: opt,
  vaxel: opt,
  epost: opt,
  epostMonster: opt,
  kontaktKalla: opt,
  kontaktKommentar: opt,
  bokslutsar: int,
  omsattningMsek: num,
  rorelseresultatMsek: num,
  rorelseresultatFgMsek: num,
  rorelsemarginal: num,
  soliditet: num,
  kassalikviditet: num,
  antalChefer: int,
  avstandKm: int,
}).refine((r) => RADARS[r.radar].types.includes(r.typ), { message: "Ogiltig signaltyp", path: ["typ"] })

const BodySchema = z.object({
  rows: z.array(InboxRowSchema).min(1).max(500),
})

// Manual signal entry (single form or pasted list). Rows go through the same
// inbox → processing path as the weekly harvest, so matching and duplicate
// protection behave identically.
export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const parsed = BodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)
  await prisma.radarInbox.createMany({
    data: parsed.data.rows.map((r) => ({
      ...r,
      slug: r.bolag.toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      tillagd: today,
    })),
  })

  const result = await processRadarInbox()
  return NextResponse.json(result, { status: 201 })
}
