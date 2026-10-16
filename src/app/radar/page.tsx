import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { processRadarInbox } from "@/lib/radar"
import TopNav from "@/components/TopNav"
import RadarBoard from "@/components/RadarBoard"

export const dynamic = "force-dynamic"

export default async function RadarPage() {
  const session = await auth()
  if (!session) redirect("/login")

  // Pick up anything the weekly harvest has written since last visit
  await processRadarInbox()

  const [signals, users, failed] = await Promise.all([
    prisma.signal.findMany({
      include: {
        statusBy: { select: { name: true } },
        company: {
          include: {
            owner: true,
            contacts: { orderBy: { createdAt: "desc" } },
            deals: { select: { id: true, status: true }, orderBy: { createdAt: "desc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.radarInbox.findMany({
      where: { processedAt: null, processError: { not: null } },
      select: { id: true, bolag: true, processError: true },
    }),
  ])

  return (
    <main className="min-h-screen">
      <TopNav currentTab="radar" isAdmin={session.user.role === "admin"} />
      <RadarBoard
        signals={JSON.parse(JSON.stringify(signals))}
        users={JSON.parse(JSON.stringify(users))}
        failed={failed}
        currentUserId={session.user.id}
      />
    </main>
  )
}
