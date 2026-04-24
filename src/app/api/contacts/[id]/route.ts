import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateContactSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  title: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  linkedin: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      deals: {
        include: {
          owner: true,
          stage: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 })
  }

  return NextResponse.json(contact)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = UpdateContactSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updateData: any = { ...parsed.data }

  // Update fullName if firstName or lastName changed
  if (parsed.data.firstName !== undefined || parsed.data.lastName !== undefined) {
    const current = await prisma.contact.findUnique({ where: { id } })
    if (!current) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    const firstName = parsed.data.firstName ?? current.firstName
    const lastName = parsed.data.lastName ?? current.lastName
    updateData.fullName = `${firstName}${lastName ? " " + lastName : ""}`.trim()
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: updateData,
    include: {
      company: true,
      deals: {
        include: {
          owner: true,
          stage: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  return NextResponse.json(contact)
}
