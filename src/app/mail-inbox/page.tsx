import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TopNav from "@/components/TopNav"
import MailInbox from "@/components/MailInbox"
import { getPendingEmailCount } from "@/lib/email-utils"
import { loadOpenDealsForScoring, scoreDealsAgainstLoaded } from "@/lib/email-matcher"
import { parseEmail } from "@/lib/email-parser"

export default async function MailInboxPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [pendingEmails, pendingCount, openDeals] = await Promise.all([
    prisma.emailLog.findMany({
      where: { status: "pending" },
      orderBy: { receivedAt: "desc" },
      take: 50,
    }),
    getPendingEmailCount(),
    loadOpenDealsForScoring(),
  ])

  const emailsWithSuggestions = pendingEmails.map((email) => {
    const { senderEmail } = parseEmail(email.from)
    const ranked = scoreDealsAgainstLoaded(senderEmail, email.subject, openDeals)
    return {
      ...email,
      suggestions: ranked.slice(0, 3).map((r) => ({
        dealId: r.dealId,
        title: r.title,
        company: r.company,
        reason: r.reason,
      })),
    }
  })

  return (
    <main className="min-h-screen">
      <TopNav currentTab="mail-inbox" isAdmin={session.user.role === "admin"} pendingEmailCount={pendingCount} />
      <MailInbox emails={JSON.parse(JSON.stringify(emailsWithSuggestions))} />
    </main>
  )
}
