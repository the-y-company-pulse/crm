import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateSessionSchema = z.object({
  date: z.string().datetime().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { sessionId } = await params
  const body = await req.json()
  const parsed = UpdateSessionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data: any = {}
  if (parsed.data.date !== undefined) data.date = new Date(parsed.data.date)
  if (parsed.data.startTime !== undefined) data.startTime = parsed.data.startTime
  if (parsed.data.endTime !== undefined) data.endTime = parsed.data.endTime
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes

  const session = await prisma.projectSession.update({
    where: { id: sessionId },
    data,
  })

  return NextResponse.json(session)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { sessionId } = await params

  await prisma.projectSession.delete({
    where: { id: sessionId },
  })

  return NextResponse.json({ ok: true })
}
