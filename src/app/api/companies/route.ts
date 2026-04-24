import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      orgNr: true,
      industry: true,
      website: true,
      createdAt: true,
      _count: {
        select: {
          deals: true,
          contacts: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(companies)
}
