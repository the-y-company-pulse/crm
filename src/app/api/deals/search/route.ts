import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""

  const deals = await prisma.deal.findMany({
    where: {
      AND: [
        { status: "open" },
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
            { contact: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      title: true,
      company: true,
      value: true,
    },
    take: 10,
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(deals)
}
