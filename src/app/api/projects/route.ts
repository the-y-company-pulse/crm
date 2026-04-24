import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CreateProjectSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().datetime(),
  format: z.string().nullable().optional(),
  maxParticipants: z.number().int().positive(),
  pricePerParticipant: z.number().int().nonnegative(),
  status: z.enum(["planned", "open", "full", "completed"]).default("planned"),
  notes: z.string().nullable().optional(),
})

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get("status")?.split(",")
  const upcoming = searchParams.get("upcoming") === "true"
  const search = searchParams.get("search")

  const where: any = {}

  if (statusFilter && statusFilter.length > 0) {
    where.status = { in: statusFilter }
  }

  if (upcoming) {
    where.startDate = { gte: new Date() }
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" }
  }

  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      startDate: true,
      format: true,
      maxParticipants: true,
      pricePerParticipant: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          participants: true,
          deals: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  })

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const parsed = CreateProjectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      startDate: new Date(parsed.data.startDate),
      format: parsed.data.format,
      maxParticipants: parsed.data.maxParticipants,
      pricePerParticipant: parsed.data.pricePerParticipant,
      status: parsed.data.status,
      notes: parsed.data.notes,
    },
    include: {
      _count: {
        select: {
          participants: true,
          deals: true,
        },
      },
    },
  })

  return NextResponse.json(project, { status: 201 })
}
