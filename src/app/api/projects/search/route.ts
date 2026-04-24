import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""

  const projects = await prisma.project.findMany({
    where: {
      name: {
        contains: q,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      status: true,
      _count: {
        select: {
          participants: true,
        },
      },
    },
    take: 10,
    orderBy: { startDate: "desc" },
  })

  return NextResponse.json(projects)
}
