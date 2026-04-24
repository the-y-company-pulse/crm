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

  // Auto-set status and wonAt/lostAt based on stage
  const updateData: any = { ...parsed.data };

  // If stageId is being updated, check if it's a terminal stage
  if (parsed.data.stageId) {
    const stage = await prisma.stage.findUnique({
      where: { id: parsed.data.stageId },
      select: { status: true }
    });

    if (stage?.status === "won") {
      updateData.status = "won";
      updateData.wonAt = new Date();
      updateData.lostAt = null;
    } else if (stage?.status === "lost") {
      updateData.status = "lost";
      updateData.lostAt = new Date();
      updateData.wonAt = null;
    } else {
      updateData.status = "open";
      updateData.wonAt = null;
      updateData.lostAt = null;
    }
  }

  // Or if status is being updated directly
  else if (parsed.data.status === "won") {
    updateData.wonAt = new Date();
    updateData.lostAt = null;
  } else if (parsed.data.status === "lost") {
    updateData.lostAt = new Date();
    updateData.wonAt = null;
  } else if (parsed.data.status === "open") {
    updateData.wonAt = null;
    updateData.lostAt = null;
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: updateData,
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
