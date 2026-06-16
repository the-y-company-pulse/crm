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
  reminderAt: string | null;
  reminderNote: string | null;
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

// --- Reminders / planned activities ---

export type ReminderStatus = "none" | "upcoming" | "today" | "overdue";

// Status of a deal's planned activity relative to today (calendar-day based).
export function reminderStatus(iso: string | null | undefined): ReminderStatus {
  if (!iso) return "none";
  const d = new Date(iso);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (day < today) return "overdue";
  if (day === today) return "today";
  return "upcoming";
}

const REMINDER_WEEKDAYS = ["sön", "mån", "tis", "ons", "tors", "fre", "lör"];
const REMINDER_MONTHS = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];

// e.g. "ons 18 jun" — short form used on cards and in the detail view.
export function formatReminderDate(iso: string): string {
  const d = new Date(iso);
  const thisYear = d.getFullYear() === new Date().getFullYear();
  const year = thisYear ? "" : ` ${d.getFullYear()}`;
  return `${REMINDER_WEEKDAYS[d.getDay()]} ${d.getDate()} ${REMINDER_MONTHS[d.getMonth()]}${year}`;
}

// "2026-06-18" — value for an <input type="date"> from a stored ISO datetime.
export function reminderDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

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
  location: string | null
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
  invoicedAmount: number
  isPaid: boolean
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
  invoiced: number
  paid: number
  _count: {
    participants: number
    deals: number
  }
}

export type ProjectDetail = Project & {
  participants: Participant[]
  sessions: ProjectSession[]
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

export type ProjectSession = {
  id: string
  projectId: string
  date: string
  startTime: string
  endTime: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type EmailLog = {
  id: string
  from: string
  to: string
  subject: string
  body: string
  bodyHtml: string | null
  receivedAt: string
  status: "pending" | "matched" | "ignored"
  matchedDealId: string | null
  createdAt: string
  updatedAt: string
}

export type EmailLogWithDeal = EmailLog & {
  matchedDeal?: {
    id: string
    title: string
    company: string | null
    contact: string | null
  } | null
}
