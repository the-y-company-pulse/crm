import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const [deals, stages, users] = await Promise.all([
    prisma.deal.findMany({
      include: {
        owner: true,
        activities: { include: { user: true }, orderBy: { occurredAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);
  return NextResponse.json({ deals, stages, users });
}

const CreateDealSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  value: z.number().int().nonnegative().default(0),
  stageId: z.string().min(1),
  ownerId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateDealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const deal = await prisma.deal.create({
    data: parsed.data,
    include: { owner: true, activities: true },
  });
  return NextResponse.json(deal, { status: 201 });
}
