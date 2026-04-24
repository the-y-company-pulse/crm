import { requireAdmin } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  color: z.string(),
  initial: z.string().length(1),
  role: z.enum(["admin", "user"]),
})

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const parsed = createUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { password, ...data } = parsed.data
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        ...data,
        hashedPassword,
      },
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      color: user.color,
      initial: user.initial,
      createdAt: user.createdAt.toISOString(),
    })
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Email redan registrerad" }, { status: 400 })
    }
    return NextResponse.json({ error: "Kunde inte skapa användare" }, { status: 500 })
  }
}
