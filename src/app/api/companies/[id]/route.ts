import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { normalizeOrgNr } from "@/lib/radar"
import { companyDetailInclude } from "@/lib/company-include"

const UpdateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  orgNr: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  address: z.string().nullable().optional(),
  employees: z.number().int().nonnegative().nullable().optional(),
  employeesNote: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  switchboard: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  emailPattern: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  gapAmbition: z.number().int().min(1).max(3).nullable().optional(),
  gapDrive: z.number().int().min(1).max(3).nullable().optional(),
  gapRationale: z.string().nullable().optional(),
  fiscalYear: z.number().int().nullable().optional(),
  revenueMsek: z.number().finite().nullable().optional(),
  operatingProfitMsek: z.number().finite().nullable().optional(),
  operatingProfitPrevMsek: z.number().finite().nullable().optional(),
  operatingMarginPct: z.number().finite().nullable().optional(),
  equityRatioPct: z.number().finite().nullable().optional(),
  quickRatioPct: z.number().finite().nullable().optional(),
  managers: z.number().int().nonnegative().nullable().optional(),
  distanceKm: z.number().int().nonnegative().nullable().optional(),
})


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const company = await prisma.company.findUnique({
    where: { id },
    include: companyDetailInclude,
  })

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }

  return NextResponse.json(company)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = UpdateCompanySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updateData: any = { ...parsed.data }

  // Update nameNorm if name is changed
  if (parsed.data.name) {
    updateData.nameNorm = parsed.data.name.trim().toLowerCase()
  }

  // orgNr is unique; store it in one canonical format
  if (parsed.data.orgNr) {
    updateData.orgNr = normalizeOrgNr(parsed.data.orgNr) ?? parsed.data.orgNr.trim()
  }

  if ("gapAmbition" in parsed.data || "gapDrive" in parsed.data || "gapRationale" in parsed.data) {
    updateData.gapAssessedAt = new Date()
  }

  try {
    const company = await prisma.company.update({
      where: { id },
      data: updateData,
      include: companyDetailInclude,
    })
    return NextResponse.json(company)
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ett annat företag har redan det org.nr:et" }, { status: 409 })
    }
    throw e
  }
}
