import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { processRadarInbox, syncRepeatBuyerSignals } from "@/lib/radar"
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

  // Pick up anything the harvests have written since last visit (one cheap
  // count when there's nothing new). Repeat-buyer signals are refreshed after
  // the response is sent, so they never slow the page down.
  const pending = await prisma.radarInbox.count({ where: { processedAt: null, processError: null } })
  if (pending > 0) await processRadarInbox()
  after(() => syncRepeatBuyerSignals())

  const [signals, users, failed, nextProgram] = await Promise.all([
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
    radar === "ledarskap"
      ? prisma.project.findFirst({
          where: {
            type: "ledarskapsprogram",
            name: { startsWith: "The Y Leadership Program" },
            status: { in: ["planned", "open"] },
            startDate: { gte: new Date() },
          },
          orderBy: { startDate: "asc" },
          select: {
            id: true, name: true, startDate: true, maxParticipants: true,
            _count: { select: { participants: { where: { status: { not: "cancelled" } } } } },
          },
        })
      : null,
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
        nextProgram={
          nextProgram && {
            id: nextProgram.id,
            name: nextProgram.name,
            startDate: nextProgram.startDate.toISOString(),
            booked: nextProgram._count.participants,
            seats: nextProgram.maxParticipants,
          }
        }
        currentUserId={session.user.id}
      />
    </main>
  )
}
