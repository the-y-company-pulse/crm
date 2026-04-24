import { auth } from "../../../../auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TopNav from "@/components/TopNav"
import ContactDetail from "@/components/ContactDetail"

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { id } = await params

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      deals: {
        include: {
          owner: true,
          stage: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!contact) notFound()

  // Fetch all companies for company selector
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  })

  return (
    <main className="min-h-screen">
      <TopNav currentTab="kontakter" isAdmin={session.user.role === "admin"} />
      <ContactDetail
        contact={JSON.parse(JSON.stringify(contact))}
        companies={JSON.parse(JSON.stringify(companies))}
      />
    </main>
  )
}
