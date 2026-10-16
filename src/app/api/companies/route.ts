import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { normalizeOrgNr } from "@/lib/radar"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      orgNr: true,
      industry: true,
      website: true,
      createdAt: true,
      _count: {
        select: {
          deals: true,
          contacts: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(companies)
}

const CreateCompanySchema = z.object({
  name: z.string().min(1),
  orgNr: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  employees: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const parsed = CreateCompanySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const normalized = parsed.data.name.trim().toLowerCase()

  const orgNr = parsed.data.orgNr ? normalizeOrgNr(parsed.data.orgNr) ?? parsed.data.orgNr.trim() : null
  if (orgNr && (await prisma.company.findUnique({ where: { orgNr } }))) {
    return NextResponse.json({ error: "Ett företag med det org.nr:et finns redan" }, { status: 409 })
  }

  const company = await prisma.company.create({
    data: {
      name: parsed.data.name.trim(),
      nameNorm: normalized,
      orgNr,
      industry: parsed.data.industry,
      website: parsed.data.website,
      address: parsed.data.address,
      employees: parsed.data.employees,
      notes: parsed.data.notes,
    },
    include: {
      _count: {
        select: {
          deals: true,
          contacts: true,
        },
      },
    },
  })

  return NextResponse.json(company, { status: 201 })
}
