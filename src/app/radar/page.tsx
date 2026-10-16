import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { processRadarInbox } from "@/lib/radar"
import { isRadarKey } from "@/lib/radar-constants"
import TopNav from "@/components/TopNav"
import RadarBoard from "@/components/RadarBoard"

export const dynamic = "force-dynamic"

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<{ radar?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { radar: radarParam } = await searchParams
  const radar = isRadarKey(radarParam) ? radarParam : "kultur"

  // Pick up anything the harvests have written since last visit
  await processRadarInbox()

  const [signals, users, failed] = await Promise.all([
    prisma.signal.findMany({
      where: { radar },
      include: {
        statusBy: { select: { name: true } },
        company: {
          include: {
            owner: true,
            contacts: {
              orderBy: { createdAt: "desc" },
              include: { _count: { select: { participants: true } } },
            },
            deals: { select: { id: true, status: true }, orderBy: { createdAt: "desc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.radarInbox.findMany({
      where: { radar, processedAt: null, processError: { not: null } },
      select: { id: true, bolag: true, processError: true },
    }),
  ])

  return (
    <main className="min-h-screen">
      <TopNav currentTab="radar" isAdmin={session.user.role === "admin"} />
      <RadarBoard
        key={radar}
        radar={radar}
        signals={JSON.parse(JSON.stringify(signals))}
        users={JSON.parse(JSON.stringify(users))}
        failed={failed}
        currentUserId={session.user.id}
      />
    </main>
  )
}
