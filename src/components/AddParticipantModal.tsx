"use client"

import { useState } from "react"
import ContactAutocomplete from "./ContactAutocomplete"

type Props = {
  projectId: string
  onClose: () => void
  onAdd: (data: {
    contactId: string
    status: "confirmed" | "tentative" | "cancelled"
    notes: string | null
  }) => void | Promise<void>
}

export default function AddParticipantModal({ projectId, onClose, onAdd }: Props) {
  const [contactId, setContactId] = useState<string | null>(null)
  const [contactName, setContactName] = useState<string | null>(null)
  const [status, setStatus] = useState<"confirmed" | "tentative" | "cancelled">("confirmed")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!contactId || submitting) return
    setSubmitting(true)
    try {
      await onAdd({
        contactId,
        status,
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
            <h2 className="font-display text-lg md:text-xl text-white">Lägg till deltagare</h2>
            <button onClick={onClose} className="md:hidden text-white/40 hover:text-white text-3xl leading-none px-2">
              ×
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <Field label="Kontaktperson">
              <ContactAutocomplete
                value={contactId}
                onChange={(id, name) => {
                  setContactId(id)
                  setContactName(name)
                }}
                placeholder="Sök eller skapa kontakt..."
              />
            </Field>

            <Field label="Status">
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="confirmed" className="bg-ink-900">Bekräftad</option>
                <option value="tentative" className="bg-ink-900">Preliminär</option>
                <option value="cancelled" className="bg-ink-900">Avbokad</option>
              </select>
            </Field>

            <Field label="Anteckningar (valfritt)">
              <textarea
                className="input min-h-[60px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="T.ex. särskilda önskemål eller information..."
              />
            </Field>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3 mt-6">
            <button onClick={onClose} className="btn touch-target flex items-center justify-center gap-2 flex-1 md:flex-initial">
              Avbryt
            </button>
            <button
              onClick={submit}
              disabled={!contactId || submitting}
              className="btn btn-primary touch-target disabled:opacity-40 flex items-center justify-center gap-2 flex-1 md:flex-initial"
            >
              Lägg till
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
