import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const contacts = await prisma.contact.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      title: true,
      email: true,
      phone: true,
      linkedin: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          deals: true,
        },
      },
    },
    orderBy: { fullName: "asc" },
  })

  return NextResponse.json(contacts)
}
