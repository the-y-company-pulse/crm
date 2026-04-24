import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q") || ""

  if (query.length < 2) {
    return NextResponse.json([])
  }

  // Search by name (case-insensitive)
  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { nameNorm: { contains: query.toLowerCase() } },
      ],
    },
    select: {
      id: true,
      name: true,
      orgNr: true,
      _count: {
        select: { deals: true },
      },
    },
    orderBy: { name: "asc" },
    take: 10,
  })

  return NextResponse.json(companies)
}
