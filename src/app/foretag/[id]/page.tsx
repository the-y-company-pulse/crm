import { auth } from "../../../../auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TopNav from "@/components/TopNav"
import CompanyDetail from "@/components/CompanyDetail"

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { id } = await params

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      deals: {
        include: {
          owner: true,
          stage: true,
        },
        orderBy: { createdAt: "desc" },
      },
      contacts: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          title: true,
        },
        orderBy: { fullName: "asc" },
      },
    },
  })

  if (!company) notFound()

  return (
    <main className="min-h-screen">
      <TopNav currentTab="foretag" />
      <CompanyDetail company={JSON.parse(JSON.stringify(company))} />
    </main>
  )
}
