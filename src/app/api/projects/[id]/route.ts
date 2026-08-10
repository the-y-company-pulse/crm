import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateProjectSchema = z.object({
  type: z.enum(["ledarskapsprogram", "vardegrundsarbete"]).optional(),
  name: z.string().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().nullable().optional(),
  format: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  maxParticipants: z.number().int().positive().optional(),
  pricePerParticipant: z.number().int().nonnegative().optional(),
  status: z.enum(["planned", "open", "full", "completed"]).optional(),
  isFavorite: z.boolean().optional(),
  notes: z.string().nullable().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          contact: {
            include: {
              company: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      sessions: {
        orderBy: { date: "asc" },
      },
      milestones: {
        orderBy: [{ date: "asc" }, { order: "asc" }],
      },
      deals: {
        include: {
          owner: true,
          stage: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = UpdateProjectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data: any = {}
  if (parsed.data.type !== undefined) data.type = parsed.data.type
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.startDate !== undefined) data.startDate = new Date(parsed.data.startDate)
  if (parsed.data.endDate !== undefined) data.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null
  if (parsed.data.format !== undefined) data.format = parsed.data.format
  if (parsed.data.location !== undefined) data.location = parsed.data.location
  if (parsed.data.maxParticipants !== undefined) data.maxParticipants = parsed.data.maxParticipants
  if (parsed.data.pricePerParticipant !== undefined) data.pricePerParticipant = parsed.data.pricePerParticipant
  if (parsed.data.status !== undefined) data.status = parsed.data.status
  if (parsed.data.isFavorite !== undefined) data.isFavorite = parsed.data.isFavorite
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes

  const project = await prisma.project.update({
    where: { id },
    data,
    include: {
      participants: {
        include: {
          contact: {
            include: {
              company: true,
            },
          },
        },
      },
      sessions: {
        orderBy: { date: "asc" },
      },
      milestones: {
        orderBy: [{ date: "asc" }, { order: "asc" }],
      },
      deals: {
        include: {
          owner: true,
          stage: true,
        },
      },
    },
  })

  return NextResponse.json(project)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params

  await prisma.project.delete({
    where: { id },
  })

  return NextResponse.json({ ok: true })
}
