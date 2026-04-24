import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().datetime().optional(),
  format: z.string().nullable().optional(),
  maxParticipants: z.number().int().positive().optional(),
  pricePerParticipant: z.number().int().nonnegative().optional(),
  status: z.enum(["planned", "open", "full", "completed"]).optional(),
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
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.startDate !== undefined) data.startDate = new Date(parsed.data.startDate)
  if (parsed.data.format !== undefined) data.format = parsed.data.format
  if (parsed.data.maxParticipants !== undefined) data.maxParticipants = parsed.data.maxParticipants
  if (parsed.data.pricePerParticipant !== undefined) data.pricePerParticipant = parsed.data.pricePerParticipant
  if (parsed.data.status !== undefined) data.status = parsed.data.status
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
