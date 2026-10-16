"use client"

import { useMemo, useState } from "react"
import type { Activity } from "@/lib/types"
import { ACTIVITY_LABELS, ACTIVITY_COLORS } from "@/lib/types"

type LogEntry = Activity & { dealTitle?: string | null }

type Props = {
  companyId: string
  activities: Activity[]
  deals: { id: string; title: string; activities?: Activity[] }[]
}

const TYPES: Activity["type"][] = ["note", "call", "email", "meeting"]

// Contact history for a company: activities logged on the company itself plus
// those on any of its deals, newest first.
export default function CompanyActivityLog({ companyId, activities: initial, deals }: Props) {
  const [own, setOwn] = useState(initial)
  const [type, setType] = useState<Activity["type"]>("call")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const entries = useMemo<LogEntry[]>(() => {
    const fromDeals = deals.flatMap((d) => (d.activities ?? []).map((a) => ({ ...a, dealTitle: d.title })))
    return [...own, ...fromDeals].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  }, [own, deals])

  async function submit() {
    if (!content.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content: content.trim() }),
      })
      if (res.ok) {
        const created: Activity = await res.json()
        setOwn((list) => [created, ...list])
        setContent("")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="glass rounded-xl p-6 mt-6">
      <h2 className="font-display text-xl text-white mb-4">Kontakthistorik ({entries.length})</h2>

      <div className="flex flex-wrap gap-2 mb-3">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 text-xs md:text-sm rounded-lg border transition-colors ${
              t === type
                ? "bg-neon text-ink-950 border-neon font-semibold"
                : "bg-white/[0.03] text-white/60 border-white/[0.10] hover:border-white/30"
            }`}
          >
            {ACTIVITY_LABELS[t]}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 mb-6">
        <textarea
          className="input min-h-[80px] text-sm"
          placeholder="Vad hände? T.ex. 'Ringde VD, återkommer efter budgetmötet'"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
          }}
        />
        <button
          onClick={submit}
          disabled={!content.trim() || submitting}
          className="btn btn-primary text-sm py-2 self-end disabled:opacity-40"
        >
          Logga
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-white/40 text-sm">Ingen kontakt loggad ännu</div>
      ) : (
        <ul className="space-y-3">
          {entries.map((a) => (
            <li key={a.id} className="flex gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <span
                className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: ACTIVITY_COLORS[a.type] }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-white/40 mb-1">
                  {ACTIVITY_LABELS[a.type]} · {a.user?.name ?? ""} ·{" "}
                  {new Date(a.occurredAt).toLocaleDateString("sv-SE")}
                  {a.dealTitle && <> · <span className="text-white/55">{a.dealTitle}</span></>}
                </div>
                <div className="text-sm text-white/85 whitespace-pre-wrap break-words">{a.content}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
