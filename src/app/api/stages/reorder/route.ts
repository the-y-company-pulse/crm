import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const ReorderSchema = z.object({
  stageIds: z.array(z.string().min(1)),
})

export async function PATCH(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const parsed = ReorderSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Update each stage with its new order
  await Promise.all(
    parsed.data.stageIds.map((id, index) =>
      prisma.stage.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  )

  const stages = await prisma.stage.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { deals: true },
      },
    },
  })

  return NextResponse.json(stages)
}
