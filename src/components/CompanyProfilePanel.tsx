"use client"

import { useState } from "react"
import { evaluateFit, type FitCompany, type FitState } from "@/lib/radar-fit"

type Props = {
  companyId: string
  company: FitCompany
}

const FIELDS: { key: keyof FitCompany; label: string; int?: boolean; suffix?: string }[] = [
  { key: "fiscalYear", label: "Bokslutsår", int: true },
  { key: "revenueMsek", label: "Omsättning", suffix: "MSEK" },
  { key: "operatingProfitMsek", label: "Rörelseresultat", suffix: "MSEK" },
  { key: "operatingProfitPrevMsek", label: "Rörelseresultat föreg. år", suffix: "MSEK" },
  { key: "operatingMarginPct", label: "Rörelsemarginal", suffix: "%" },
  { key: "equityRatioPct", label: "Soliditet", suffix: "%" },
  { key: "quickRatioPct", label: "Kassalikviditet", suffix: "%" },
  { key: "managers", label: "Antal chefer", int: true },
  { key: "distanceKm", label: "Avstånd till Göteborg (överstyr)", int: true, suffix: "km" },
]

const STATE_STYLE: Record<FitState, string> = {
  ok: "text-[rgb(var(--c-won))]",
  no: "text-[rgb(var(--c-lost))]",
  unknown: "text-white/40",
}
const MARK: Record<FitState, string> = { ok: "✓", no: "✕", unknown: "?" }

function toForm(c: FitCompany) {
  return Object.fromEntries(FIELDS.map((f) => [f.key, c[f.key]?.toString().replace(".", ",") ?? ""])) as Record<string, string>
}

// Ledarskapsradarn on the company page: financial profile and how it matches
// the open leadership program (lönsamt, kassaflöde, 10–30 ledare, inom 10 mil).
export default function CompanyProfilePanel({ companyId, company: initial }: Props) {
  const [company, setCompany] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => toForm(initial))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fit = evaluateFit(company)

  async function save() {
    const body: Record<string, number | null> = {}
    for (const f of FIELDS) {
      const raw = form[f.key].replace(/\s|%/g, "").replace(/−/g, "-").replace(",", ".")
      if (!raw) { body[f.key] = null; continue }
      const n = Number(raw)
      if (!Number.isFinite(n)) { setError(`Ogiltigt tal: ${f.label}`); return }
      body[f.key] = f.int ? Math.round(n) : n
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { setError("Kunde inte spara"); return }
      const updated = await res.json()
      setCompany({ ...company, ...updated })
      setForm(toForm({ ...company, ...updated }))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-white">Ekonomi & programprofil</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-ghost text-sm rounded-md">Redigera</button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {fit.map((f) => (
          <div key={f.key} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
            <div className={`text-sm font-semibold ${STATE_STYLE[f.state]}`}>{MARK[f.state]} {f.label}</div>
            <div className="text-xs text-white/50 mt-1">{f.detail}</div>
          </div>
        ))}
      </div>

      {editing ? (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">
                  {f.label}{f.suffix ? ` (${f.suffix})` : ""}
                </label>
                <input
                  className="input py-2 text-sm"
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/35 mt-2">
            Rörelsemarginal räknas ut från resultat och omsättning om den lämnas tom. Avståndet räknas ut från orten om det lämnas tomt.
          </p>
          {error && <div className="text-sm text-[rgb(var(--c-lost))] mt-2">{error}</div>}
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => { setForm(toForm(company)); setEditing(false); setError(null) }} className="btn text-sm py-2">Avbryt</button>
            <button onClick={save} disabled={saving} className="btn btn-primary text-sm py-2">Spara</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
          {FIELDS.filter((f) => f.key !== "distanceKm").map((f) => (
            <div key={f.key} className="flex justify-between gap-2 py-1 border-b border-white/[0.05]">
              <span className="text-white/40">{f.label}</span>
              <span className="text-white/85">
                {company[f.key] != null
                  ? `${f.key === "fiscalYear" ? company[f.key] : company[f.key]!.toLocaleString("sv-SE")}${f.suffix ? ` ${f.suffix}` : ""}`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
