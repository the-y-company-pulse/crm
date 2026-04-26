import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const [deals, stages, users] = await Promise.all([
    prisma.deal.findMany({
      include: {
        owner: true,
        activities: { include: { user: true }, orderBy: { occurredAt: "desc" } },
        company_rel: true,
        contact_rel: { include: { company: true } },
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
  // New: companyId if selecting existing, company if creating new
  companyId: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  // New: contactId if selecting existing, contact if creating new
  contactId: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  value: z.number().int().nonnegative().default(0),
  stageId: z.string().min(1),
  ownerId: z.string().min(1),
  projectId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = CreateDealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const dealData: any = {
    title: parsed.data.title,
    value: parsed.data.value,
    stageId: parsed.data.stageId,
    ownerId: parsed.data.ownerId,
  };

  // Handle company: create if new, link if existing
  if (parsed.data.companyId) {
    dealData.companyId = parsed.data.companyId;
  } else if (parsed.data.company) {
    // Create new company
    const normalized = parsed.data.company.trim().toLowerCase();
    const company = await prisma.company.create({
      data: {
        name: parsed.data.company.trim(),
        nameNorm: normalized,
      },
    });
    dealData.companyId = company.id;
  }

  // Handle contact: create if new, link if existing
  if (parsed.data.contactId) {
    dealData.contactId = parsed.data.contactId;
  } else if (parsed.data.contact) {
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
        companyId: dealData.companyId || null,
      },
    });
    dealData.contactId = contact.id;
  }

  // Keep fritext fields as backup
  dealData.company = parsed.data.company;
  dealData.contact = parsed.data.contact;
  dealData.email = parsed.data.email;
  dealData.phone = parsed.data.phone;

  // Add project if provided
  if (parsed.data.projectId) {
    dealData.projectId = parsed.data.projectId;
  }

  const deal = await prisma.deal.create({
    data: dealData,
    include: {
      owner: true,
      stage: true,
      activities: true,
      company_rel: true,
      contact_rel: { include: { company: true } },
      project: true,
    },
  });
  return NextResponse.json(deal, { status: 201 });
}
