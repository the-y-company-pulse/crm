export type User = {
  id: string;
  name: string;
  email: string;
  color: string;
  initial: string;
};

export type Stage = {
  id: string;
  name: string;
  order: number;
  status: string | null;
};

export type Activity = {
  id: string;
  type: "note" | "call" | "email" | "meeting";
  content: string;
  occurredAt: string;
  userId: string;
  user?: User;
};

export type Deal = {
  id: string;
  title: string;
  company: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  value: number;
  notes: string | null;
  status: string;
  stageId: string;
  ownerId: string;
  owner?: User;
  activities?: Activity[];
  wonAt: string | null;
  lostAt: string | null;
  expectedCloseDate: string | null;
  projectId?: string | null;
  project?: {
    id: string;
    name: string;
    startDate: string;
    status: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type Target = {
  id: string;
  userId: string | null; // null = company-wide
  user?: User | null;
  year: number;
  month: number | null; // null = annual target
  amount: number;
};

// Matches the response from GET /api/sales/summary
export type SalesSummary = {
  year: number;
  userId: string | null;
  yearTotal: number;
  prevTotal: number;
  delta: number;
  deltaPct: number | null;
  wonCount: number;
  lostCount: number;
  hitRate: number;
  monthlyThis: { value: number; count: number }[]; // length 12
  monthlyPrev: { value: number; count: number }[];
  yearlyTarget: number;
  monthlyTargets: number[]; // length 12
};

export const ACTIVITY_LABELS: Record<Activity["type"], string> = {
  note: "Anteckning",
  call: "Samtal",
  email: "Mail",
  meeting: "Möte",
};

export const ACTIVITY_COLORS: Record<Activity["type"], string> = {
  note: "#888780",
  call: "#1D9E75",
  email: "#378ADD",
  meeting: "#7F77DD",
};

export type Project = {
  id: string
  name: string
  startDate: string
  format: string | null
  maxParticipants: number
  pricePerParticipant: number
  status: "planned" | "open" | "full" | "completed"
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type Participant = {
  id: string
  projectId: string
  contactId: string
  status: "confirmed" | "tentative" | "cancelled"
  notes: string | null
  contact?: {
    id: string
    fullName: string
    email: string | null
    phone: string | null
    company?: { id: string; name: string } | null
  }
}

export type ProjectWithStats = Project & {
  _count: {
    participants: number
    deals: number
  }
}

export type ProjectDetail = Project & {
  participants: Participant[]
  deals: Array<{
    id: string
    title: string
    value: number
    status: string
    stage: { name: string }
    owner: { name: string; color: string; initial: string }
  }>
}

export const PROJECT_STATUS_LABELS: Record<Project["status"], string> = {
  planned: "Planerad",
  open: "Öppen",
  full: "Full",
  completed: "Genomförd",
}

export const PROJECT_STATUS_COLORS: Record<Project["status"], string> = {
  planned: "#888780",
  open: "#378ADD",
  full: "#deff00",
  completed: "#1D9E75",
}

export const PARTICIPANT_STATUS_LABELS: Record<Participant["status"], string> = {
  confirmed: "Bekräftad",
  tentative: "Preliminär",
  cancelled: "Avbokad",
}
