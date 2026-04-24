import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TopNav from "@/components/TopNav"
import AdminDashboard from "@/components/AdminDashboard"

export default async function AdminPage() {
  const session = await auth()

  if (!session) redirect("/login")
  if (session.user.role !== "admin") redirect("/")

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      color: true,
      initial: true,
      createdAt: true,
    },
  })

  return (
    <main className="min-h-screen">
      <TopNav currentTab="pipeline" />
      <AdminDashboard
        users={JSON.parse(JSON.stringify(users))}
        currentUserId={session.user.id}
      />
    </main>
  )
}
