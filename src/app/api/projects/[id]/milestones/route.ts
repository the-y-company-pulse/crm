import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CreateMilestoneSchema = z.object({
  title: z.string().min(1),
  date: z.string().datetime(),
  status: z.enum(["planned", "done"]).default("planned"),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error

  const { id: projectId } = await params
  const body = await req.json()
  const parsed = CreateMilestoneSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Place new milestones last within their day.
  const last = await prisma.milestone.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  })

  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      title: parsed.data.title,
      date: new Date(parsed.data.date),
      status: parsed.data.status,
      completedAt: parsed.data.status === "done" ? new Date() : null,
      order: (last?.order ?? -1) + 1,
      notes: parsed.data.notes ?? null,
    },
  })

  return NextResponse.json(milestone, { status: 201 })
}
