import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TopNav from "@/components/TopNav"
import MailInbox from "@/components/MailInbox"
import { getPendingEmailCount } from "@/lib/email-utils"

export default async function MailInboxPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [pendingEmails, pendingCount] = await Promise.all([
    prisma.emailLog.findMany({
      where: { status: "pending" },
      orderBy: { receivedAt: "desc" },
      take: 50,
    }),
    getPendingEmailCount(),
  ])

  return (
    <main className="min-h-screen">
      <TopNav currentTab="mail-inbox" isAdmin={session.user.role === "admin"} pendingEmailCount={pendingCount} />
      <MailInbox emails={JSON.parse(JSON.stringify(pendingEmails))} />
    </main>
  )
}
