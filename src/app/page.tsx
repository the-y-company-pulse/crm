import { prisma } from "@/lib/prisma";
import Kanban from "@/components/Kanban";
import TopNav from "@/components/TopNav";
import PipelineDashboard from "@/components/PipelineDashboard";
import type { FavoriteProject, PartnerSales } from "@/components/PipelineDashboard";
import type { Deal, Stage, User } from "@/lib/types";
import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { getPendingEmailCount } from "@/lib/email-utils";

export const dynamic = "force-dynamic";

const MONTH_NAMES = ["januari","februari","mars","april","maj","juni","juli","augusti","september","oktober","november","december"];

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [deals, stages, users, pendingEmailCount, favoriteProjects, wonThisMonth] = await Promise.all([
    prisma.deal.findMany({
      include: {
        owner: true,
        activities: { include: { user: true }, orderBy: { occurredAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    getPendingEmailCount(),
    prisma.project.findMany({
      where: { isFavorite: true },
      select: {
        id: true, name: true, startDate: true, status: true, maxParticipants: true,
        _count: { select: { participants: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.deal.findMany({
      where: { status: "won", wonAt: { gte: monthStart, lt: monthEnd } },
      select: { value: true, ownerId: true },
    }),
  ]);

  // Serialize Date → string for client component
  const serialize = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

  const isAdmin = session.user.role === "admin";

  const favorites: FavoriteProject[] = favoriteProjects.map((p) => ({
    id: p.id,
    name: p.name,
    startDate: p.startDate.toISOString(),
    status: p.status as FavoriteProject["status"],
    count: p._count.participants,
    max: p.maxParticipants,
  }));

  const partnerSales: PartnerSales[] = users
    .map((u) => {
      const mine = wonThisMonth.filter((d) => d.ownerId === u.id);
      return {
        id: u.id,
        name: u.name,
        color: u.color,
        initial: u.initial,
        value: mine.reduce((s, d) => s + d.value, 0),
        count: mine.length,
      };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <main className="min-h-screen">
      <TopNav currentTab="pipeline" isAdmin={isAdmin} pendingEmailCount={pendingEmailCount} />
      <PipelineDashboard
        favorites={favorites}
        partnerSales={partnerSales}
        monthLabel={MONTH_NAMES[now.getUTCMonth()]}
      />
      <Kanban
        initialDeals={serialize(deals) as unknown as Deal[]}
        stages={serialize(stages) as unknown as Stage[]}
        users={serialize(users) as unknown as User[]}
        currentUserId={session.user.id}
      />
    </main>
  );
}
