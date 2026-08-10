import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateMilestoneSchema = z.object({
  title: z.string().min(1).optional(),
  date: z.string().datetime().optional(),
  status: z.enum(["planned", "done"]).optional(),
  notes: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { milestoneId } = await params
  const body = await req.json()
  const parsed = UpdateMilestoneSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data: any = {}
  if (parsed.data.title !== undefined) data.title = parsed.data.title
  if (parsed.data.date !== undefined) data.date = new Date(parsed.data.date)
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes
  // Stamp/clear completedAt to match the status transition.
  if (parsed.data.status !== undefined) {
    data.status = parsed.data.status
    data.completedAt = parsed.data.status === "done" ? new Date() : null
  }

  const milestone = await prisma.milestone.update({
    where: { id: milestoneId },
    data,
  })

  return NextResponse.json(milestone)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { milestoneId } = await params

  await prisma.milestone.delete({
    where: { id: milestoneId },
  })

  return NextResponse.json({ ok: true })
}
