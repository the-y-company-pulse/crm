import { prisma } from "./prisma"
import { extractDomain } from "./email-parser"

export async function matchEmailToDeal(
  senderEmail: string,
  subject: string,
  body: string
): Promise<{ id: string; ownerId: string } | null> {
  const domain = extractDomain(senderEmail)

  // Strategy 1: Direct contact email match
  const contactMatch = await prisma.contact.findFirst({
    where: {
      email: {
        equals: senderEmail,
        mode: "insensitive",
      },
    },
    include: {
      company: true,
    },
  })

  if (contactMatch) {
    // Find most recent open deal for this contact
    const deal = await prisma.deal.findFirst({
      where: {
        OR: [
          { contactId: contactMatch.id },
          { companyId: contactMatch.company?.id },
        ],
        status: "open",
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, ownerId: true },
    })

    if (deal) return deal
  }

  // Strategy 2: Company domain match
  if (domain) {
    const company = await prisma.company.findFirst({
      where: {
        OR: [
          { website: { contains: domain, mode: "insensitive" } },
          { nameNorm: { contains: domain.split(".")[0], mode: "insensitive" } },
        ],
      },
    })

    if (company) {
      const deal = await prisma.deal.findFirst({
        where: {
          companyId: company.id,
          status: "open",
        },
        orderBy: { updatedAt: "desc" },
        select: { id: true, ownerId: true },
      })

      if (deal) return deal
    }
  }

  // Strategy 3: Subject/body keyword match (basic)
  // Look for project names or deal titles in subject
  if (subject) {
    const deal = await prisma.deal.findFirst({
      where: {
        title: { contains: subject, mode: "insensitive" },
        status: "open",
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, ownerId: true },
    })

    if (deal) return deal
  }

  // No match found
  return null
}
