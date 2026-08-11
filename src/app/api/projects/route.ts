import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CreateProjectSchema = z.object({
  type: z.enum(["ledarskapsprogram", "vardegrundsarbete"]).default("ledarskapsprogram"),
  name: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  value: z.number().int().nonnegative().default(0),
  format: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  // Course-only fields — optional so an engagement can skip them.
  maxParticipants: z.number().int().nonnegative().default(0),
  pricePerParticipant: z.number().int().nonnegative().default(0),
  status: z.enum(["planned", "open", "full", "completed"]).default("planned"),
  notes: z.string().nullable().optional(),
  // Activities to seed as milestones (used by the Värdegrundsarbete create flow).
  milestones: z
    .array(
      z.object({
        title: z.string().min(1),
        date: z.string().datetime(),
        status: z.enum(["planned", "done"]).default("planned"),
      })
    )
    .optional(),
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
      type: true,
      name: true,
      startDate: true,
      endDate: true,
      format: true,
      maxParticipants: true,
      pricePerParticipant: true,
      status: true,
      isFavorite: true,
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
      type: parsed.data.type,
      name: parsed.data.name,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      value: parsed.data.value,
      format: parsed.data.format,
      location: parsed.data.location,
      maxParticipants: parsed.data.maxParticipants,
      pricePerParticipant: parsed.data.pricePerParticipant,
      status: parsed.data.status,
      notes: parsed.data.notes,
      milestones: parsed.data.milestones?.length
        ? {
            create: parsed.data.milestones.map((m, i) => ({
              title: m.title,
              date: new Date(m.date),
              status: m.status,
              completedAt: m.status === "done" ? new Date() : null,
              order: i,
            })),
          }
        : undefined,
    },
    include: {
      milestones: {
        orderBy: [{ date: "asc" }, { order: "asc" }],
      },
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
