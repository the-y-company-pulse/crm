import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year");
  const where = yearParam ? { year: parseInt(yearParam, 10) } : {};
  const targets = await prisma.target.findMany({
    where,
    include: { user: true },
    orderBy: [{ year: "desc" }, { userId: "asc" }, { month: "asc" }],
  });
  return NextResponse.json(targets);
}

const UpsertSchema = z.object({
  userId: z.string().nullable(), // null = company-wide
  year: z.number().int(),
  month: z.number().int().min(1).max(12).nullable(), // null = annual
  amount: z.number().int().nonnegative(),
});

// POST upserts a target by (userId, year, month).
// Note: Prisma's `upsert` doesn't reliably work with nullable fields in the
// unique key (Postgres treats NULL as distinct from NULL in unique constraints),
// so we use find-then-create/update instead. amount=0 deletes the target.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { userId, year, month, amount } = parsed.data;

  const existing = await prisma.target.findFirst({
    where: { userId, year, month },
  });

  if (amount === 0) {
    if (existing) await prisma.target.delete({ where: { id: existing.id } });
    return NextResponse.json({ deleted: true });
  }

  const target = existing
    ? await prisma.target.update({
        where: { id: existing.id },
        data: { amount },
        include: { user: true },
      })
    : await prisma.target.create({
        data: { userId, year, month, amount },
        include: { user: true },
      });

  return NextResponse.json(target);
}
