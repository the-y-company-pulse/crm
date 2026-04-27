import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const MatchEmailSchema = z.object({
  dealId: z.string().min(1),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const { id: logId } = await params
  const body = await req.json()
  const parsed = MatchEmailSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const emailLog = await prisma.emailLog.findUnique({
    where: { id: logId },
  })

  if (!emailLog) {
    return NextResponse.json({ error: "Email log not found" }, { status: 404 })
  }

  // Create activity
  const emailContent = `Ämne: ${emailLog.subject}
Från: ${emailLog.from}
Mottaget: ${emailLog.receivedAt.toLocaleString("sv-SE")}

${emailLog.body}`

  await prisma.activity.create({
    data: {
      dealId: parsed.data.dealId,
      type: "email",
      content: emailContent,
      userId: userId!,
      occurredAt: emailLog.receivedAt,
    },
  })

  // Mark as matched
  await prisma.emailLog.update({
    where: { id: logId },
    data: {
      status: "matched",
      matchedDealId: parsed.data.dealId,
    },
  })

  return NextResponse.json({ ok: true })
}
