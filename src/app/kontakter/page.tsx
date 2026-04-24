import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TopNav from "@/components/TopNav"
import ContactList from "@/components/ContactList"

export default async function ContactsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const contacts = await prisma.contact.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      title: true,
      email: true,
      phone: true,
      linkedin: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          deals: true,
        },
      },
    },
    orderBy: { fullName: "asc" },
  })

  return (
    <main className="min-h-screen">
      <TopNav currentTab="kontakter" isAdmin={session.user.role === "admin"} />
      <ContactList contacts={JSON.parse(JSON.stringify(contacts))} />
    </main>
  )
}
