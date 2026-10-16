"use client"

import { useState } from "react"
import { RADAR_STATUSES, type RadarStatus } from "@/lib/radar-constants"

type Signal = {
  id: string
  type: string
  summary: string
  eventDate: string | null
  sourceName: string | null
  sourceUrl: string | null
  strength: string | null
  angle: string | null
  status: RadarStatus
  createdAt: string
}

type Gap = {
  gapAmbition: number | null
  gapDrive: number | null
  gapRationale: string | null
  gapAssessedAt: string | null
}

type Props = {
  companyId: string
  signals: Signal[]
  gap: Gap
}

// Kulturradarn on the company page: the company's signals over time, plus the
// glappanalys (ambition vs. how well the values drive it).
export default function CompanyRadarPanel({ companyId, signals: initialSignals, gap: initialGap }: Props) {
  const [signals, setSignals] = useState(initialSignals)
  const [gap, setGap] = useState(initialGap)
  const [editingGap, setEditingGap] = useState(false)
  const [draft, setDraft] = useState(initialGap)
  const [saving, setSaving] = useState(false)

  async function updateStatus(id: string, status: RadarStatus) {
    const prev = signals
    setSignals((list) => list.map((s) => (s.id === id ? { ...s, status } : s)))
    const res = await fetch(`/api/signals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) setSignals(prev)
  }

  async function saveGap() {
    setSaving(true)
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gapAmbition: draft.gapAmbition,
          gapDrive: draft.gapDrive,
          gapRationale: draft.gapRationale?.trim() || null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        const next = {
          gapAmbition: updated.gapAmbition,
          gapDrive: updated.gapDrive,
          gapRationale: updated.gapRationale,
          gapAssessedAt: updated.gapAssessedAt,
        }
        setGap(next)
        setDraft(next)
        setEditingGap(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const topProspect = gap.gapAmbition === 3 && gap.gapDrive === 1

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <div className="glass rounded-xl p-6 lg:col-span-2">
        <h2 className="font-display text-xl text-white mb-4">Radarsignaler ({signals.length})</h2>
        {signals.length === 0 ? (
          <div className="text-white/40 text-sm">Inga signaler för det här bolaget</div>
        ) : (
          <ul className="space-y-3">
            {signals.map((s) => (
              <li key={s.id} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="text-xs text-white/50">
                    <span className="text-white/80 font-medium">{s.type}</span>
                    {s.eventDate && ` · ${s.eventDate}`}
                    {s.strength && ` · Styrka ${s.strength.toLowerCase()}`}
                  </div>
                  <select
                    value={s.status}
                    onChange={(e) => updateStatus(s.id, e.target.value as RadarStatus)}
                    className="input w-auto py-1 px-2 text-xs"
                    aria-label="Status"
                  >
                    {RADAR_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-white/85">{s.summary}</p>
                {s.angle && <p className="text-sm text-white/50 mt-1">Vinkel: {s.angle}</p>}
                <div className="text-xs text-white/35 mt-2">
                  Tillagd {new Date(s.createdAt).toLocaleDateString("sv-SE")}
                  {s.sourceUrl && (
                    <>
                      {" · "}
                      <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-neon hover:underline">
                        {s.sourceName ?? "Källa"}
                      </a>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-white">Glappanalys</h2>
          {!editingGap && (
            <button onClick={() => setEditingGap(true)} className="btn-ghost text-sm rounded-md">
              {gap.gapAmbition || gap.gapDrive ? "Ändra" : "Bedöm"}
            </button>
          )}
        </div>
        {editingGap ? (
          <div className="space-y-4">
            <ScorePicker
              label="Ambition"
              hint="Hur höga är de publicerade målen?"
              value={draft.gapAmbition}
              onChange={(v) => setDraft({ ...draft, gapAmbition: v })}
            />
            <ScorePicker
              label="Värderingarnas drivkraft"
              hint="Driver värderingarna mot målen?"
              value={draft.gapDrive}
              onChange={(v) => setDraft({ ...draft, gapDrive: v })}
            />
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Motivering</label>
              <textarea
                value={draft.gapRationale ?? ""}
                onChange={(e) => setDraft({ ...draft, gapRationale: e.target.value })}
                className="input min-h-[100px] text-sm"
                placeholder="Kort motivering, t.ex. vad målen och värderingarna säger"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setDraft(gap); setEditingGap(false) }} className="btn text-sm py-2">Avbryt</button>
              <button onClick={saveGap} disabled={saving} className="btn btn-primary text-sm py-2">Spara</button>
            </div>
          </div>
        ) : gap.gapAmbition || gap.gapDrive ? (
          <div className="space-y-3 text-sm">
            {topProspect && (
              <div className="text-xs font-semibold text-neon border border-neon/40 rounded-md px-2.5 py-1.5 inline-block">
                Topprospekt: hög ambition, låg drivkraft
              </div>
            )}
            <ScoreRow label="Ambition" value={gap.gapAmbition} />
            <ScoreRow label="Drivkraft" value={gap.gapDrive} />
            {gap.gapRationale && <p className="text-white/75 whitespace-pre-wrap">{gap.gapRationale}</p>}
            {gap.gapAssessedAt && (
              <p className="text-xs text-white/35">Bedömd {new Date(gap.gapAssessedAt).toLocaleDateString("sv-SE")} · hypotes, inte diagnos</p>
            )}
          </div>
        ) : (
          <p className="text-white/40 text-sm">
            Inte bedömd ännu. Jämför publicerade värderingar med publicerade mål.
          </p>
        )}
      </div>
    </div>
  )
}

function ScorePicker({
  label, hint, value, onChange,
}: {
  label: string
  hint: string
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-0.5">{label}</label>
      <p className="text-xs text-white/35 mb-2">{hint}</p>
      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            onClick={() => onChange(value === n ? null : n)}
            className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-colors ${
              value === n
                ? "bg-neon text-ink-950 border-neon"
                : "bg-white/[0.03] text-white/60 border-white/[0.10] hover:border-white/30"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function ScoreRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40">{label}</span>
      <span className="flex gap-1">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`w-3 h-3 rounded-full ${value != null && n <= value ? "bg-neon" : "bg-white/[0.10]"}`}
          />
        ))}
      </span>
    </div>
  )
}
