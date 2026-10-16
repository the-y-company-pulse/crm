import { auth } from "../../../../auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { companyDetailInclude } from "@/lib/company-include"
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

  const [company, users] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: companyDetailInclude,
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ])

  if (!company) notFound()

  return (
    <main className="min-h-screen">
      <TopNav currentTab="foretag" isAdmin={session.user.role === "admin"} />
      <CompanyDetail
        company={JSON.parse(JSON.stringify(company))}
        users={JSON.parse(JSON.stringify(users))}
      />
    </main>
  )
}
