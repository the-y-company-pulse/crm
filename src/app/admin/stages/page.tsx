import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import TopNav from "@/components/TopNav"
import StageManager from "@/components/StageManager"

export default async function AdminStagesPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "admin") redirect("/")

  const stages = await prisma.stage.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { deals: true },
      },
    },
  })

  return (
    <main className="min-h-screen">
      <TopNav currentTab="pipeline" isAdmin={true} />
      <div className="px-8 py-8">
        {/* Admin Navigation */}
        <div className="mb-6 flex gap-2 p-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg w-fit">
          <Link
            href="/admin"
            className="px-5 py-2.5 text-sm font-medium rounded-md transition-colors text-white/50 hover:text-white/80"
          >
            Användare
          </Link>
          <Link
            href="/admin/stages"
            className="px-5 py-2.5 text-sm font-medium rounded-md transition-colors bg-white/[0.10] text-white"
          >
            Faser
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-3xl text-white mb-2">Hantera faser</h1>
          <p className="text-white/40 text-sm">
            Skapa, redigera och ordna faser för din pipeline
          </p>
        </div>
        <StageManager stages={JSON.parse(JSON.stringify(stages))} />
      </div>
    </main>
  )
}
