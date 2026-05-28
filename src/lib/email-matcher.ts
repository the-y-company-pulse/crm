import { prisma } from "./prisma"
import { extractDomain } from "./email-parser"

export type RankedDeal = {
  dealId: string
  ownerId: string
  title: string
  company: string | null
  score: number
  reason: string
}

type ScoringDeal = {
  id: string
  ownerId: string
  title: string
  email: string | null
  updatedAt: Date
  company: string | null
  contact_rel: { email: string | null } | null
  company_rel: { name: string; website: string | null } | null
}

const AUTO_MATCH_THRESHOLD = 90

export async function loadOpenDealsForScoring(): Promise<ScoringDeal[]> {
  return prisma.deal.findMany({
    where: { status: "open" },
    select: {
      id: true,
      ownerId: true,
      title: true,
      email: true,
      updatedAt: true,
      company: true,
      contact_rel: { select: { email: true } },
      company_rel: { select: { name: true, website: true } },
    },
  })
}

export function scoreDealsAgainstLoaded(
  senderEmail: string,
  subject: string,
  openDeals: ScoringDeal[]
): RankedDeal[] {
  const senderLower = senderEmail.toLowerCase()
  const domain = extractDomain(senderEmail)
  const subjectLower = subject?.toLowerCase() ?? ""
  const now = Date.now()
  const ranked: RankedDeal[] = []

  for (const deal of openDeals) {
    let score = 0
    const reasons: string[] = []

    const contactEmail = deal.contact_rel?.email?.toLowerCase()
    if (contactEmail && contactEmail === senderLower) {
      score += 100
      reasons.push("kontaktens e-post")
    }

    const dealEmail = deal.email?.toLowerCase()
    if (dealEmail && dealEmail === senderLower) {
      score += 90
      reasons.push("affärens e-post")
    }

    if (domain && deal.company_rel?.website) {
      const website = deal.company_rel.website.toLowerCase()
      if (website.includes(domain)) {
        score += 50
        reasons.push("företagets domän")
      }
    }

    const titleLower = deal.title.toLowerCase().trim()
    if (titleLower.length >= 4 && subjectLower.includes(titleLower)) {
      score += 40
      reasons.push("titel i ämnesrad")
    }

    if (score > 0) {
      const ageMs = now - new Date(deal.updatedAt).getTime()
      if (ageMs < 14 * 24 * 60 * 60 * 1000) score += 10

      ranked.push({
        dealId: deal.id,
        ownerId: deal.ownerId,
        title: deal.title,
        company: deal.company_rel?.name ?? deal.company ?? null,
        score,
        reason: reasons.join(" + "),
      })
    }
  }

  ranked.sort((a, b) => b.score - a.score)
  return ranked
}

export async function scoreDealsForEmail(
  senderEmail: string,
  subject: string
): Promise<RankedDeal[]> {
  const deals = await loadOpenDealsForScoring()
  return scoreDealsAgainstLoaded(senderEmail, subject, deals)
}

export async function matchEmailToDeal(
  senderEmail: string,
  subject: string,
  _body: string
): Promise<{ id: string; ownerId: string } | null> {
  const ranked = await scoreDealsForEmail(senderEmail, subject)
  const top = ranked[0]
  if (top && top.score >= AUTO_MATCH_THRESHOLD) {
    return { id: top.dealId, ownerId: top.ownerId }
  }
  return null
}
