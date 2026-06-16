"use client";

import { reminderStatus, formatReminderDate } from "@/lib/types";

type Props = {
  reminderAt: string | null;
  reminderNote?: string | null;
  /** "sm" for cards, "md" for the detail view */
  size?: "sm" | "md";
};

// Small bell pill shown on deal cards. Turns red when the planned date has passed.
export default function ReminderBadge({ reminderAt, reminderNote, size = "sm" }: Props) {
  const status = reminderStatus(reminderAt);
  if (status === "none" || !reminderAt) return null;

  const styles: Record<"upcoming" | "today" | "overdue", string> = {
    upcoming: "bg-white/[0.06] text-white/55 border-white/[0.10]",
    today: "bg-neon/15 text-neon border-neon/30",
    overdue: "bg-red-600/20 text-red-400 border-red-600/40 reminder-overdue",
  };

  const pad = size === "md" ? "px-2.5 py-1 text-sm gap-1.5" : "px-2 py-0.5 text-xs gap-1";
  const icon = size === "md" ? "w-4 h-4" : "w-3 h-3";
  const label = status === "overdue" ? `Försenad · ${formatReminderDate(reminderAt)}` : formatReminderDate(reminderAt);
  const title = reminderNote
    ? `${reminderNote} (${formatReminderDate(reminderAt)})`
    : `Planerad aktivitet: ${formatReminderDate(reminderAt)}`;

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${pad} ${styles[status]}`}
      title={title}
    >
      <svg className={icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {label}
    </span>
  );
}
