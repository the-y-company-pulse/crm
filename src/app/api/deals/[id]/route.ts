import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";

const UpdateDealSchema = z.object({
  title: z.string().min(1).optional(),
  company: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  value: z.number().int().nonnegative().optional(),
  notes: z.string().nullable().optional(),
  stageId: z.string().min(1).optional(),
  ownerId: z.string().min(1).optional(),
  status: z.enum(["open", "won", "lost"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateDealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const deal = await prisma.deal.update({
    where: { id },
    data: parsed.data,
    include: {
      owner: true,
      activities: { include: { user: true }, orderBy: { occurredAt: "desc" } },
    },
  });
  return NextResponse.json(deal);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  await prisma.deal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
