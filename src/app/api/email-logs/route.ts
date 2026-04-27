import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || "pending"

  const logs = await prisma.emailLog.findMany({
    where: { status },
    include: {
      matchedDeal: {
        select: {
          id: true,
          title: true,
          company: true,
          contact: true,
        },
      },
    },
    orderBy: { receivedAt: "desc" },
    take: 50,
  })

  return NextResponse.json(logs)
}
