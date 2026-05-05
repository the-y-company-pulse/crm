import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const ReorderSchema = z.object({
  stageIds: z.array(z.string().min(1)),
})

export async function PATCH(req: NextRequest) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const body = await req.json()
    const parsed = ReorderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Use transaction to update all stages atomically
    // First set all to temporary negative values to avoid unique constraint conflicts
    await prisma.$transaction([
      // Step 1: Set all to temporary negative values
      ...parsed.data.stageIds.map((id, index) =>
        prisma.stage.update({
          where: { id },
          data: { order: -(index + 1) },
        })
      ),
      // Step 2: Set to final positive values
      ...parsed.data.stageIds.map((id, index) =>
        prisma.stage.update({
          where: { id },
          data: { order: index + 1 },
        })
      ),
    ])

    const stages = await prisma.stage.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { deals: true },
        },
      },
    })

    return NextResponse.json(stages)
  } catch (error) {
    console.error("Stage reorder error:", error)
    return NextResponse.json(
      { error: "Failed to reorder stages", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
