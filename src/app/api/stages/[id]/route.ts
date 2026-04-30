import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateStageSchema = z.object({
  name: z.string().min(1).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = UpdateStageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data: any = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name

  const stage = await prisma.stage.update({
    where: { id },
    data,
  })

  return NextResponse.json(stage)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params

  // Check if stage has deals
  const stage = await prisma.stage.findUnique({
    where: { id },
    include: {
      _count: {
        select: { deals: true },
      },
    },
  })

  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 })
  }

  if (stage._count.deals > 0) {
    return NextResponse.json(
      { error: `Cannot delete stage with ${stage._count.deals} deals. Move deals to another stage first.` },
      { status: 400 }
    )
  }

  // Check if this is the last stage
  const totalStages = await prisma.stage.count()
  if (totalStages <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last stage. At least one stage is required." },
      { status: 400 }
    )
  }

  // Delete stage
  await prisma.stage.delete({
    where: { id },
  })

  // Reorder remaining stages to fill gap
  const stages = await prisma.stage.findMany({
    orderBy: { order: "asc" },
  })

  await Promise.all(
    stages.map((s, index) =>
      prisma.stage.update({
        where: { id: s.id },
        data: { order: index + 1 },
      })
    )
  )

  return NextResponse.json({ success: true })
}
