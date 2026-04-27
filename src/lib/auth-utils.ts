import { auth } from "../../auth"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), userId: null }
  }
  return { session, error: null, userId: session.user.id }
}

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  if (session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { session, error: null }
}
