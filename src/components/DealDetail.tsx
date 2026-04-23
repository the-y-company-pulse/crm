"use client";

import { useState } from "react";
import type { Deal, User, Activity } from "@/lib/types";
import { ACTIVITY_LABELS, ACTIVITY_COLORS } from "@/lib/types";
import EditDealModal from "./EditDealModal";

type Props = {
  deal: Deal;
  users: User[];
  currentUserId: string;
  onClose: () => void;
  onAddActivity: (type: Activity["type"], content: string) => void | Promise<void>;
  onDealUpdate: (updated: Deal) => void;
};

const TYPES: Activity["type"][] = ["note", "call", "email", "meeting"];

export default function DealDetail({ deal, users, currentUserId, onClose, onAddActivity, onDealUpdate }: Props) {
  const [type, setType] = useState<Activity["type"]>("note");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(new Set());

  const fmt = (v: number) => v.toLocaleString("sv-SE") + " SEK";
  const ownerColor = deal.owner?.color ?? "#888";
  const ownerInitial = deal.owner?.initial ?? "?";
  const ownerTextColor = ownerColor === "#deff00" ? "#0a1420" : "white";

  async function submit() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddActivity(type, content.trim());
      setContent("");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const months = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
    const yearSuffix = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : "";
    return `${d.getDate()} ${months[d.getMonth()]}${yearSuffix} · ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
  }

  const toggleActivity = (id: string) => {
    setCollapsedActivities(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-ink-950/90 backdrop-blur-md z-40 animate-in fade-in duration-200 flex items-center justify-center p-8"
        onClick={onClose}
      >
        <div
          className="bg-navy-800 border border-white/[0.12] rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
        <header className="px-8 py-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-white leading-tight">{deal.title}</h2>
            <p className="text-base text-white/50 mt-2">
              {[deal.company, deal.contact].filter(Boolean).join(" · ")}
            </p>
            {(deal.email || deal.phone) && (
              <p className="text-sm text-white/35 mt-1.5">
                {[deal.email, deal.phone].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="text-xl font-medium text-neon mt-4">{fmt(deal.value)}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] transition"
              title="Redigera affär"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <span
              className="owner-dot w-10 h-10 text-sm"
              style={{ background: ownerColor, color: ownerTextColor }}
              title={deal.owner?.name}
            >
              {ownerInitial}
            </span>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white text-3xl leading-none px-2 -mr-2"
              aria-label="Stäng"
            >
              ×
            </button>
          </div>
        </header>

        <div className="px-8 py-5 border-b border-white/[0.06]">
          <div className="flex flex-wrap gap-2 mb-4">
            {TYPES.map((t) => {
              const icons = {
                note: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
                call: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
                email: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
                meeting: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
              };
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors flex items-center gap-2 ${
                    t === type
                      ? "bg-neon text-ink-950 border-neon font-semibold"
                      : "bg-white/[0.03] text-white/60 border-white/[0.10] hover:border-white/30"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {icons[t]}
                  </svg>
                  {ACTIVITY_LABELS[t]}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-3">
            <textarea
              className="input flex-1 min-h-[180px] resize-y text-base"
              placeholder="Vad hände? T.ex. 'Ringde, väntar på svar v.18' eller klistra in hela mailkonversationen..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
            />
            <button
              onClick={submit}
              disabled={!content.trim() || submitting}
              className="btn btn-primary disabled:opacity-40 self-end px-6 py-2.5 text-base flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Logga
            </button>
          </div>
          <p className="text-xs text-white/30 mt-2">
            Tips: Tryck Cmd/Ctrl + Enter för att logga snabbt
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-5">
          {(deal.activities ?? []).length === 0 ? (
            <p className="text-base text-white/30 text-center py-16">
              Inga aktiviteter än.<br />Logga första kontakten ovan.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {deal.activities?.map((a) => {
                const isCollapsed = collapsedActivities.has(a.id);
                const isLong = a.content.length > 200;
                const activityIcons = {
                  note: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
                  call: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
                  email: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
                  meeting: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
                };
                return (
                  <li key={a.id} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-5 flex gap-4">
                    <span
                      className="owner-dot w-9 h-9 flex-shrink-0 flex items-center justify-center"
                      style={{ background: ACTIVITY_COLORS[a.type] }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {activityIcons[a.type]}
                      </svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-white/40">
                          {ACTIVITY_LABELS[a.type]} · {a.user?.name ?? ""} · {formatDate(a.occurredAt)}
                        </div>
                        {isLong && (
                          <button
                            onClick={() => toggleActivity(a.id)}
                            className="text-xs text-white/50 hover:text-white/80 transition px-2 py-1 rounded hover:bg-white/[0.05]"
                          >
                            {isCollapsed ? "Visa mer" : "Visa mindre"}
                          </button>
                        )}
                      </div>
                      <div className={`text-base text-white/85 whitespace-pre-wrap break-words leading-relaxed ${isCollapsed ? "line-clamp-3" : ""}`}>
                        {a.content}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        </div>
      </div>

      {showEditModal && (
        <EditDealModal
          deal={deal}
          users={users}
          onClose={() => setShowEditModal(false)}
          onSaved={onDealUpdate}
        />
      )}
    </>
  );
}
