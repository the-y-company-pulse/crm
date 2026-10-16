import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CreateDealFromSignalSchema = z.object({
  ownerId: z.string().min(1).optional(),
})

// Moves a radar prospect into the pipeline: creates a deal in the first open
// stage ("Prospekt") linked to the company and its most relevant contact.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const { id } = await params
  const parsed = CreateDealFromSignalSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const signal = await prisma.signal.findUnique({
    where: { id },
    include: {
      company: {
        include: {
          contacts: { orderBy: { createdAt: "desc" }, take: 1 },
          deals: { where: { status: "open" }, select: { id: true } },
        },
      },
    },
  })
  if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 })

  if (signal.company.deals.length > 0) {
    return NextResponse.json(
      { error: "Bolaget har redan en öppen deal", dealId: signal.company.deals[0].id },
      { status: 409 }
    )
  }

  const stage =
    (await prisma.stage.findFirst({ where: { name: "Prospekt", status: null } })) ??
    (await prisma.stage.findFirst({ where: { status: null }, orderBy: { order: "asc" } }))
  if (!stage) return NextResponse.json({ error: "Ingen öppen pipeline-stage finns" }, { status: 500 })

  const ownerId = parsed.data.ownerId ?? signal.company.ownerId ?? userId!
  const contact = signal.company.contacts[0] ?? null

  const deal = await prisma.$transaction(async (tx) => {
    const created = await tx.deal.create({
      data: {
        title: `${signal.company.name} – ${signal.type}`,
        companyId: signal.companyId,
        contactId: contact?.id ?? null,
        company: signal.company.name,
        contact: contact?.fullName ?? null,
        email: contact?.email ?? null,
        phone: contact?.phone ?? null,
        notes: [signal.summary, signal.angle && `Vinkel: ${signal.angle}`, signal.sourceUrl]
          .filter(Boolean)
          .join("\n"),
        stageId: stage.id,
        ownerId,
        source: "kulturradarn",
        sourceId: signal.id,
      },
    })
    if (!signal.company.ownerId) {
      await tx.company.update({ where: { id: signal.companyId }, data: { ownerId } })
    }
    return created
  })

  return NextResponse.json(deal, { status: 201 })
}
