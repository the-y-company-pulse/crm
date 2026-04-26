import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CreateSessionsSchema = z.object({
  dates: z.array(z.string().datetime()),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error

  const { id: projectId } = await params
  const body = await req.json()
  const parsed = CreateSessionsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Create multiple sessions at once
  const sessions = await prisma.projectSession.createMany({
    data: parsed.data.dates.map((dateStr) => ({
      projectId,
      date: new Date(dateStr),
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      notes: parsed.data.notes,
    })),
  })

  // Fetch created sessions to return
  const createdSessions = await prisma.projectSession.findMany({
    where: { projectId },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(createdSessions, { status: 201 })
}
