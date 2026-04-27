import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id: logId } = await params

  await prisma.emailLog.update({
    where: { id: logId },
    data: { status: "ignored" },
  })

  return NextResponse.json({ ok: true })
}
