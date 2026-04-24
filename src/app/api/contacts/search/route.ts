import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q") || ""
  const companyId = searchParams.get("companyId")

  if (query.length < 2) {
    return NextResponse.json([])
  }

  // Build where clause
  const where: any = {
    OR: [
      { fullName: { contains: query, mode: "insensitive" } },
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ],
  }

  // Filter by company if provided
  if (companyId) {
    where.companyId = companyId
  }

  const contacts = await prisma.contact.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      title: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: { deals: true },
      },
    },
    orderBy: { fullName: "asc" },
    take: 10,
  })

  return NextResponse.json(contacts)
}
