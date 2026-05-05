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

    // Use transaction with callback to update in two phases
    await prisma.$transaction(async (tx) => {
      // Phase 1: Set all to temporary high values (1000+) to avoid conflicts
      for (let i = 0; i < parsed.data.stageIds.length; i++) {
        await tx.stage.update({
          where: { id: parsed.data.stageIds[i] },
          data: { order: 1000 + i },
        })
      }

      // Phase 2: Set to final correct values (1, 2, 3...)
      for (let i = 0; i < parsed.data.stageIds.length; i++) {
        await tx.stage.update({
          where: { id: parsed.data.stageIds[i] },
          data: { order: i + 1 },
        })
      }
    })

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
