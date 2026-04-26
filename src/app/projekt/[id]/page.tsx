import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TopNav from "@/components/TopNav"
import ProjectDetail from "@/components/ProjectDetail"

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          contact: {
            include: {
              company: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      sessions: {
        orderBy: { date: "asc" },
      },
      deals: {
        include: {
          owner: true,
          stage: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!project) {
    redirect("/projekt")
  }

  return (
    <main className="min-h-screen">
      <TopNav currentTab="projekt" isAdmin={session.user.role === "admin"} />
      <ProjectDetail project={JSON.parse(JSON.stringify(project))} />
    </main>
  )
}
