import { requireAdmin } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  // Prevent deleting yourself
  if (session.user.id === id) {
    return NextResponse.json({ error: "Kan inte ta bort dig själv" }, { status: 400 })
  }

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Kunde inte ta bort användare" }, { status: 500 })
  }
}
