import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sales/summary?year=2026&userId=<id|all>
//
// Returns everything the dashboard needs in one call:
//   - monthly[] for current year and previous year (won amounts, won counts)
//   - yearTotal current + previous
//   - hitRate over the requested year
//   - targets (yearly + 12 monthly) for the requested scope
//
// userId omitted or "all" → company-wide (all users)
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()), 10);
  const userIdParam = url.searchParams.get("userId");
  const ownerFilter =
    !userIdParam || userIdParam === "all" ? {} : { ownerId: userIdParam };
  const targetUserId = !userIdParam || userIdParam === "all" ? null : userIdParam;

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
    prisma.target.findMany({
      where: { userId: targetUserId, year },
    }),
  ]);

  // Bucket into 12 months
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

  // Targets — split into yearly + monthly
  const yearlyTarget = targets.find((t: { month: number | null; amount: number }) => t.month === null)?.amount ?? 0;
  const monthlyTargets: number[] = Array.from({ length: 12 }, (_, i) => {
    const t = targets.find((x: { month: number | null; amount: number }) => x.month === i + 1);
    return t?.amount ?? 0;
  });

  return NextResponse.json({
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
  });
}
