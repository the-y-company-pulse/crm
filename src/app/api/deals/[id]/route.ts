import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";

const UpdateDealSchema = z.object({
  title: z.string().min(1).optional(),
  // New: companyId if selecting existing, company if creating new
  companyId: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  // New: contactId if selecting existing, contact if creating new
  contactId: z.string().nullable().optional(),
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

  // Build update data
  const updateData: any = {};

  // Handle basic fields
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.value !== undefined) updateData.value = parsed.data.value;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  if (parsed.data.ownerId !== undefined) updateData.ownerId = parsed.data.ownerId;

  // Handle company: create if new, link if existing, or clear
  if (parsed.data.companyId !== undefined) {
    updateData.companyId = parsed.data.companyId;
  } else if (parsed.data.company !== undefined) {
    if (parsed.data.company) {
      // Create new company
      const normalized = parsed.data.company.trim().toLowerCase();
      const company = await prisma.company.create({
        data: {
          name: parsed.data.company.trim(),
          nameNorm: normalized,
        },
      });
      updateData.companyId = company.id;
    } else {
      // Clear company
      updateData.companyId = null;
    }
  }

  // Handle contact: create if new, link if existing, or clear
  if (parsed.data.contactId !== undefined) {
    updateData.contactId = parsed.data.contactId;
  } else if (parsed.data.contact !== undefined) {
    if (parsed.data.contact) {
      // Parse name
      const fullName = parsed.data.contact.trim();
      const parts = fullName.split(/\s+/);
      const firstName = parts.length === 1 ? parts[0] : parts.slice(0, -1).join(" ");
      const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

      // Create new contact
      const contact = await prisma.contact.create({
        data: {
          firstName,
          lastName,
          fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          companyId: updateData.companyId || null,
        },
      });
      updateData.contactId = contact.id;
    } else {
      // Clear contact
      updateData.contactId = null;
    }
  }

  // Keep fritext fields as backup
  if (parsed.data.company !== undefined) updateData.company = parsed.data.company;
  if (parsed.data.contact !== undefined) updateData.contact = parsed.data.contact;
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;

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
      company_rel: true,
      contact_rel: { include: { company: true } },
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
