import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateParticipantSchema = z.object({
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
  notes: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { participantId } = await params
  const body = await req.json()
  const parsed = UpdateParticipantSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const participant = await prisma.participant.update({
    where: { id: participantId },
    data: parsed.data,
    include: {
      contact: {
        include: {
          company: true,
        },
      },
    },
  })

  return NextResponse.json(participant)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { participantId } = await params

  await prisma.participant.delete({
    where: { id: participantId },
  })

  return NextResponse.json({ ok: true })
}
