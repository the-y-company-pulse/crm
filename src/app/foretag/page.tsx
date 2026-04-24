import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TopNav from "@/components/TopNav"
import CompanyList from "@/components/CompanyList"

export default async function CompaniesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      orgNr: true,
      industry: true,
      website: true,
      createdAt: true,
      _count: {
        select: {
          deals: true,
          contacts: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <main className="min-h-screen">
      <TopNav currentTab="foretag" />
      <CompanyList companies={JSON.parse(JSON.stringify(companies))} />
    </main>
  )
}
