"use client"

import { useState } from "react"

type Props = {
  onClose: () => void
  onCreate: (data: {
    name: string
    orgNr: string | null
    industry: string | null
    website: string | null
    address: string | null
    employees: number | null
    notes: string | null
  }) => void | Promise<void>
}

export default function NewCompanyModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("")
  const [orgNr, setOrgNr] = useState("")
  const [industry, setIndustry] = useState("")
  const [website, setWebsite] = useState("")
  const [address, setAddress] = useState("")
  const [employees, setEmployees] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      await onCreate({
        name: name.trim(),
        orgNr: orgNr.trim() || null,
        industry: industry.trim() || null,
        website: website.trim() || null,
        address: address.trim() || null,
        employees: employees ? parseInt(employees, 10) : null,
        notes: notes.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink-950/90 md:bg-ink-950/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 pointer-events-none">
        <div className="bg-ink-900 border-0 md:border md:border-white/[0.10] rounded-none md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-w-md p-4 md:p-6 overflow-y-auto pointer-events-auto">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="font-display text-lg md:text-xl text-white">Nytt företag</h2>
            <button onClick={onClose} className="md:hidden text-white/40 hover:text-white text-3xl leading-none px-2">
              ×
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <Field label="Företagsnamn">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="t.ex. Volvo Group"
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Organisationsnummer">
                <input
                  className="input"
                  value={orgNr}
                  onChange={(e) => setOrgNr(e.target.value)}
                  placeholder="556012-5790"
                />
              </Field>
              <Field label="Bransch">
                <input
                  className="input"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="t.ex. Fordonsindustri"
                />
              </Field>
            </div>

            <Field label="Webbplats">
              <input
                type="url"
                className="input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.example.com"
              />
            </Field>

            <Field label="Adress">
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Gatuadress, Ort"
              />
            </Field>

            <Field label="Antal anställda">
              <input
                type="number"
                className="input"
                inputMode="numeric"
                value={employees}
                onChange={(e) => setEmployees(e.target.value)}
                placeholder="0"
                min="0"
              />
            </Field>

            <Field label="Anteckningar (valfritt)">
              <textarea
                className="input min-h-[80px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Övriga detaljer om företaget..."
              />
            </Field>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3 mt-6">
            <button onClick={onClose} className="btn touch-target flex items-center justify-center gap-2 flex-1 md:flex-initial">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Avbryt
            </button>
            <button
              onClick={submit}
              disabled={!name.trim() || submitting}
              className="btn btn-primary touch-target disabled:opacity-40 flex items-center justify-center gap-2 flex-1 md:flex-initial"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Skapa
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
