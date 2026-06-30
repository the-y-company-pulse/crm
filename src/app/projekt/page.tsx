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
      name: true,
      startDate: true,
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
      name: project.name,
      startDate: project.startDate,
      format: project.format,
      maxParticipants: project.maxParticipants,
      pricePerParticipant: project.pricePerParticipant,
      status: project.status,
      isFavorite: project.isFavorite,
      createdAt: project.createdAt,
      invoiced,
      paid,
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
