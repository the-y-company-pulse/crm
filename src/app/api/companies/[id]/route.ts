import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  orgNr: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  address: z.string().nullable().optional(),
  employees: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
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
    include: {
      deals: {
        include: {
          owner: true,
          stage: true,
        },
        orderBy: { createdAt: "desc" },
      },
      contacts: {
        orderBy: { fullName: "asc" },
      },
    },
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

  const company = await prisma.company.update({
    where: { id },
    data: updateData,
    include: {
      deals: {
        include: {
          owner: true,
          stage: true,
        },
        orderBy: { createdAt: "desc" },
      },
      contacts: {
        orderBy: { fullName: "asc" },
      },
    },
  })

  return NextResponse.json(company)
}
