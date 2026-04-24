"use client";

import { useState } from "react";
import Link from "next/link";
import type { Deal, User, Activity } from "@/lib/types";
import { ACTIVITY_LABELS, ACTIVITY_COLORS, PROJECT_STATUS_LABELS } from "@/lib/types";
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

  async function handleMarkWon() {
    if (!confirm("Markera denna affär som vunnen?")) return;
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "won" }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated: Deal = await res.json();
      onDealUpdate(updated);
      onClose();
    } catch (err) {
      console.error("Failed to mark as won:", err);
      alert("Kunde inte uppdatera affären");
    }
  }

  async function handleMarkLost() {
    if (!confirm("Markera denna affär som förlorad?")) return;
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "lost" }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated: Deal = await res.json();
      onDealUpdate(updated);
      onClose();
    } catch (err) {
      console.error("Failed to mark as lost:", err);
      alert("Kunde inte uppdatera affären");
    }
  }

  async function handleDelete() {
    if (!confirm("Är du säker på att du vill ta bort denna affär? Detta går inte att ångra.")) return;
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      onClose();
      window.location.reload(); // Reload to update the list
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Kunde inte ta bort affären");
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-ink-950/98 md:bg-black/90 backdrop-blur-lg z-40 flex items-center justify-center p-0 md:p-8"
        onClick={onClose}
      >
        <div
          className="bg-navy-800 border-0 md:border md:border-white/[0.12] rounded-none md:rounded-2xl w-full md:max-w-4xl h-full md:h-[90vh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        <header className="px-4 md:px-8 py-4 md:py-6 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-start justify-between gap-4 mb-4 md:mb-0">
            <div className="flex-1 min-w-0 order-2 md:order-1">
              <h2 className="font-display text-xl md:text-2xl text-white leading-tight">{deal.title}</h2>
              <p className="text-sm md:text-base text-white/50 mt-1 md:mt-2">
              {[
                (deal as any).company_rel?.name || deal.company,
                (deal as any).contact_rel?.fullName || deal.contact
              ].filter(Boolean).join(" · ")}
            </p>
            {((deal as any).contact_rel?.email || (deal as any).contact_rel?.phone || deal.email || deal.phone) && (
              <p className="text-sm text-white/35 mt-1.5">
                {[
                  (deal as any).contact_rel?.email || deal.email,
                  (deal as any).contact_rel?.phone || deal.phone
                ].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="text-lg md:text-xl font-medium text-neon mt-2 md:mt-4">{fmt(deal.value)}</p>

            {deal.project && (
              <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                <div className="text-xs text-white/40 mb-1">Kopplat projekt</div>
                <Link
                  href={`/projekt/${deal.project.id}`}
                  className="text-white font-medium hover:text-neon transition"
                >
                  {deal.project.name}
                </Link>
                <div className="text-xs text-white/40 mt-1">
                  {new Date(deal.project.startDate).toLocaleDateString("sv-SE")} · {PROJECT_STATUS_LABELS[deal.project.status as keyof typeof PROJECT_STATUS_LABELS]}
                </div>
              </div>
            )}
          </div>

          {/* Close button and owner - right side on desktop, top on mobile */}
          <div className="flex items-center gap-3 order-1 md:order-2">
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white text-3xl leading-none px-2 -mr-2 md:hidden"
              aria-label="Stäng"
            >
              ×
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] transition touch-target"
              title="Redigera affär"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <span
              className="owner-dot w-9 h-9 md:w-10 md:h-10 text-sm touch-target"
              style={{ background: ownerColor, color: ownerTextColor }}
              title={deal.owner?.name}
            >
              {ownerInitial}
            </span>
            <button
              onClick={onClose}
              className="hidden md:block text-white/40 hover:text-white text-3xl leading-none px-2 -mr-2"
              aria-label="Stäng"
            >
              ×
            </button>
          </div>
        </div>

        {/* Action buttons - moved outside to be below on mobile */}
        <div className="flex flex-wrap gap-2 mt-4">
            {deal.status !== "won" && (
              <button
                onClick={handleMarkWon}
                className="touch-target px-3 py-2 text-xs md:text-sm font-medium rounded-md bg-green-600/20 text-green-400 hover:bg-green-600/30 active:bg-green-600/40 border border-green-600/30 transition-colors"
              >
                ✓ Vunnen
              </button>
            )}
            {deal.status !== "lost" && (
              <button
                onClick={handleMarkLost}
                className="touch-target px-3 py-2 text-xs md:text-sm font-medium rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 active:bg-red-600/40 border border-red-600/30 transition-colors"
              >
                ✕ Förlorad
              </button>
            )}
            <button
              onClick={handleDelete}
              className="touch-target px-3 py-2 text-xs md:text-sm font-medium rounded-md bg-white/[0.05] text-white/40 hover:bg-red-600/20 hover:text-red-400 active:bg-red-600/30 border border-white/[0.08] hover:border-red-600/30 transition-colors"
            >
              🗑 Ta bort
            </button>
          </div>
        </header>

        <div className="px-4 md:px-8 py-4 md:py-5 border-b border-white/[0.06] flex-shrink-0">
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
                  className={`touch-target px-3 md:px-4 py-2 text-xs md:text-sm rounded-lg border transition-colors flex items-center gap-1.5 md:gap-2 ${
                    t === type
                      ? "bg-neon text-ink-950 border-neon font-semibold"
                      : "bg-white/[0.03] text-white/60 border-white/[0.10] hover:border-white/30 active:bg-white/[0.05]"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {icons[t]}
                  </svg>
                  <span className="hidden sm:inline">{ACTIVITY_LABELS[t]}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-3">
            <textarea
              className="input flex-1 min-h-[120px] md:min-h-[180px] resize-y text-sm md:text-base"
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
              className="btn btn-primary disabled:opacity-40 self-end touch-target px-4 md:px-6 py-2 md:py-2.5 text-sm md:text-base flex items-center gap-2"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Logga
            </button>
          </div>
          <p className="text-xs text-white/30 mt-2 hidden md:block">
            Tips: Tryck Cmd/Ctrl + Enter för att logga snabbt
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-5">
          {(deal.activities ?? []).length === 0 ? (
            <p className="text-sm md:text-base text-white/30 text-center py-12 md:py-16">
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
                  <li key={a.id} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 md:p-5 flex gap-3 md:gap-4">
                    <span
                      className="owner-dot w-8 h-8 md:w-9 md:h-9 flex-shrink-0 flex items-center justify-center"
                      style={{ background: ACTIVITY_COLORS[a.type] }}
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {activityIcons[a.type]}
                      </svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="text-xs md:text-sm text-white/40 truncate">
                          {ACTIVITY_LABELS[a.type]} · {a.user?.name ?? ""} · {formatDate(a.occurredAt)}
                        </div>
                        {isLong && (
                          <button
                            onClick={() => toggleActivity(a.id)}
                            className="touch-target text-xs text-white/50 hover:text-white/80 active:text-white transition px-2 py-1 rounded hover:bg-white/[0.05] flex-shrink-0"
                          >
                            {isCollapsed ? "Mer" : "Mindre"}
                          </button>
                        )}
                      </div>
                      <div className={`text-sm md:text-base text-white/85 whitespace-pre-wrap break-words leading-relaxed ${isCollapsed ? "line-clamp-3" : ""}`}>
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
