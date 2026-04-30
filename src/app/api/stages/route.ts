import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CreateStageSchema = z.object({
  name: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

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

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const parsed = CreateStageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Get highest order number
  const lastStage = await prisma.stage.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  })

  const newOrder = (lastStage?.order ?? 0) + 1

  const stage = await prisma.stage.create({
    data: {
      name: parsed.data.name,
      order: newOrder,
      status: null,
    },
    include: {
      _count: {
        select: { deals: true },
      },
    },
  })

  return NextResponse.json(stage, { status: 201 })
}
