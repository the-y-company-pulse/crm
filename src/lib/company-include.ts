// Shared include for the company detail page and API
export const companyDetailInclude = {
  owner: true,
  deals: {
    include: {
      owner: true,
      stage: true,
      activities: { include: { user: true }, orderBy: { occurredAt: "desc" as const } },
    },
    orderBy: { createdAt: "desc" as const },
  },
  contacts: {
    orderBy: { fullName: "asc" as const },
  },
  signals: {
    include: { statusBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" as const },
  },
  activities: { include: { user: true }, orderBy: { occurredAt: "desc" as const } },
}
