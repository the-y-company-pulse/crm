import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TopNav from "@/components/TopNav"
import ProjectList from "@/components/ProjectList"

export default async function ProjectsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const projectsRaw = await prisma.project.findMany({
    select: {
      id: true,
      type: true,
      name: true,
      startDate: true,
      endDate: true,
      value: true,
      format: true,
      maxParticipants: true,
      pricePerParticipant: true,
      status: true,
      isFavorite: true,
      createdAt: true,
      participants: {
        select: {
          invoicedAmount: true,
          isPaid: true,
        },
      },
      milestones: {
        orderBy: [{ date: "asc" }, { order: "asc" }],
      },
      sessions: {
        select: { date: true },
      },
      _count: {
        select: {
          participants: true,
          deals: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  })

  // Calculate invoiced and paid amounts
  const projects = projectsRaw.map((project) => {
    const invoiced = project.participants.reduce((sum, p) => sum + p.invoicedAmount, 0)
    const paid = project.participants
      .filter((p) => p.isPaid)
      .reduce((sum, p) => sum + p.invoicedAmount, 0)

    return {
      id: project.id,
      type: project.type,
      name: project.name,
      startDate: project.startDate,
      endDate: project.endDate,
      value: project.value,
      format: project.format,
      maxParticipants: project.maxParticipants,
      pricePerParticipant: project.pricePerParticipant,
      status: project.status,
      isFavorite: project.isFavorite,
      createdAt: project.createdAt,
      invoiced,
      paid,
      milestones: project.milestones,
      sessions: project.sessions,
      _count: project._count,
    }
  })

  return (
    <main className="min-h-screen">
      <TopNav currentTab="projekt" isAdmin={session.user.role === "admin"} />
      <ProjectList projects={JSON.parse(JSON.stringify(projects))} />
    </main>
  )
}
