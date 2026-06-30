import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// Mark a deal's planned activity (reminder) as completed:
// clears the reminder and logs a note activity so it stays traceable.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existing = await prisma.deal.findUnique({
    where: { id },
    select: { reminderAt: true, reminderNote: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const content = existing.reminderNote
    ? `Slutförde planerad aktivitet: ${existing.reminderNote}`
    : "Slutförde planerad aktivitet";

  const [, deal] = await prisma.$transaction([
    prisma.activity.create({
      data: { dealId: id, type: "note", content, userId: userId! },
    }),
    prisma.deal.update({
      where: { id },
      data: { reminderAt: null, reminderNote: null },
      include: {
        owner: true,
        stage: true,
        activities: { include: { user: true }, orderBy: { occurredAt: "desc" } },
        company_rel: true,
        contact_rel: { include: { company: true } },
        project: true,
      },
    }),
  ]);

  return NextResponse.json(deal);
}
