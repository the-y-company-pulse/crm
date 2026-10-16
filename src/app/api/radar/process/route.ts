import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { processRadarInbox } from "@/lib/radar"

// Process pending radar inbox rows. Failed rows are retried (their error is cleared first).
export async function POST() {
  const { error } = await requireAuth()
  if (error) return error

  await prisma.radarInbox.updateMany({
    where: { processedAt: null, processError: { not: null } },
    data: { processError: null },
  })
  const result = await processRadarInbox()
  return NextResponse.json(result)
}
