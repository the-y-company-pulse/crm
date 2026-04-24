import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TopNav from "@/components/TopNav"
import ProjectList from "@/components/ProjectList"

export default async function ProjectsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      startDate: true,
      format: true,
      maxParticipants: true,
      pricePerParticipant: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          participants: true,
          deals: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  })

  return (
    <main className="min-h-screen">
      <TopNav currentTab="projekt" isAdmin={session.user.role === "admin"} />
      <ProjectList projects={JSON.parse(JSON.stringify(projects))} />
    </main>
  )
}
