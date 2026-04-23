import { prisma } from "@/lib/prisma";
import StatistikDashboard from "@/components/StatistikDashboard";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ year?: string; userId?: string }>;

export default async function StatistikPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const year = parseInt(params.year ?? String(new Date().getFullYear()), 10);
  const userId = params.userId ?? "all";

  const [users, summary] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    fetchSummary(year, userId),
  ]);

  // Per-user summaries for the "per consultant" panel
  const byUser = await Promise.all(
    users.map(async (u: { id: string }) => ({
      user: u,
      summary: await fetchSummary(year, u.id),
    }))
  );

  return (
    <main className="min-h-screen">
      <TopNav currentTab="statistik" />
      <StatistikDashboard
        year={year}
        userId={userId}
        users={JSON.parse(JSON.stringify(users))}
        summary={summary}
        byUser={JSON.parse(JSON.stringify(byUser))}
      />
    </main>
  );
}

async function fetchSummary(year: number, userId: string) {
  // Inline the same logic as /api/sales/summary to avoid an HTTP roundtrip during SSR
  const ownerFilter = userId === "all" ? {} : { ownerId: userId };
  const targetUserId = userId === "all" ? null : userId;

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
  const prevStart = new Date(Date.UTC(year - 1, 0, 1));
  const prevEnd = new Date(Date.UTC(year, 0, 1));

  const [wonThis, wonPrev, lostThis, targets] = await Promise.all([
    prisma.deal.findMany({
      where: { ...ownerFilter, status: "won", wonAt: { gte: yearStart, lt: yearEnd } },
      select: { value: true, wonAt: true },
    }),
    prisma.deal.findMany({
      where: { ...ownerFilter, status: "won", wonAt: { gte: prevStart, lt: prevEnd } },
      select: { value: true, wonAt: true },
    }),
    prisma.deal.count({
      where: { ...ownerFilter, status: "lost", lostAt: { gte: yearStart, lt: yearEnd } },
    }),
    prisma.target.findMany({ where: { userId: targetUserId, year } }),
  ]);

  const bucket = () => Array.from({ length: 12 }, () => ({ value: 0, count: 0 }));
  const monthlyThis = bucket();
  const monthlyPrev = bucket();
  for (const d of wonThis) {
    if (!d.wonAt) continue;
    const m = d.wonAt.getUTCMonth();
    monthlyThis[m].value += d.value;
    monthlyThis[m].count += 1;
  }
  for (const d of wonPrev) {
    if (!d.wonAt) continue;
    const m = d.wonAt.getUTCMonth();
    monthlyPrev[m].value += d.value;
    monthlyPrev[m].count += 1;
  }

  const yearTotal = monthlyThis.reduce((s, m) => s + m.value, 0);
  const prevTotal = monthlyPrev.reduce((s, m) => s + m.value, 0);
  const wonCount = monthlyThis.reduce((s, m) => s + m.count, 0);
  const closedCount = wonCount + lostThis;
  const hitRate = closedCount > 0 ? wonCount / closedCount : 0;

  const yearlyTarget = targets.find((t: { month: number | null; amount: number }) => t.month === null)?.amount ?? 0;
  const monthlyTargets: number[] = Array.from({ length: 12 }, (_, i) => {
    const t = targets.find((x: { month: number | null; amount: number }) => x.month === i + 1);
    return t?.amount ?? 0;
  });

  return {
    year,
    userId: targetUserId,
    yearTotal,
    prevTotal,
    delta: yearTotal - prevTotal,
    deltaPct: prevTotal > 0 ? (yearTotal - prevTotal) / prevTotal : null,
    wonCount,
    lostCount: lostThis,
    hitRate,
    monthlyThis,
    monthlyPrev,
    yearlyTarget,
    monthlyTargets,
  };
}
