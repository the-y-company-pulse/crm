import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { RADAR_STATUSES } from "@/lib/radar-constants"

const UpdateSignalSchema = z.object({
  status: z.enum(RADAR_STATUSES),
})

// Triage a radar signal. Status is human-only — this is the only place it is written.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const { id } = await params
  const parsed = UpdateSignalSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const signal = await prisma.signal.update({
    where: { id },
    data: {
      status: parsed.data.status,
      statusChangedAt: new Date(),
      statusById: userId,
    },
  })
  return NextResponse.json(signal)
}
