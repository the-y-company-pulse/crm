import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const AddParticipantSchema = z.object({
  contactId: z.string().min(1),
  status: z.enum(["confirmed", "tentative", "cancelled"]).default("confirmed"),
  invoicedAmount: z.number().int().nonnegative().default(0),
  isPaid: z.boolean().default(false),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error

  const { id: projectId } = await params
  const body = await req.json()
  const parsed = AddParticipantSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const participant = await prisma.participant.create({
    data: {
      projectId,
      contactId: parsed.data.contactId,
      status: parsed.data.status,
      invoicedAmount: parsed.data.invoicedAmount,
      isPaid: parsed.data.isPaid,
      notes: parsed.data.notes,
    },
    include: {
      contact: {
        include: {
          company: true,
        },
      },
    },
  })

  return NextResponse.json(participant, { status: 201 })
}
