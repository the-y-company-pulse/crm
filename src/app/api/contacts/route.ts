import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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

const CreateContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  fullName: z.string().min(1),
  title: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const parsed = CreateContactSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const contact = await prisma.contact.create({
    data: {
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      fullName: parsed.data.fullName.trim(),
      title: parsed.data.title,
      email: parsed.data.email,
      phone: parsed.data.phone,
      linkedin: parsed.data.linkedin,
      companyId: parsed.data.companyId,
    },
    include: {
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
  })

  return NextResponse.json(contact, { status: 201 })
}
