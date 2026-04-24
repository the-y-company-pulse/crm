import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";

const CreateActivitySchema = z.object({
  type: z.enum(["note", "call", "email", "meeting"]),
  content: z.string().min(1),
  userId: z.string().min(1),
  occurredAt: z.string().datetime().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id: dealId } = await params;
  const body = await req.json();
  const parsed = CreateActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const activity = await prisma.activity.create({
    data: {
      dealId,
      type: parsed.data.type,
      content: parsed.data.content,
      userId: parsed.data.userId,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : new Date(),
    },
    include: { user: true },
  });
  return NextResponse.json(activity, { status: 201 });
}
