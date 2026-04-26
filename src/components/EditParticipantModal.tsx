"use client"

import { useState } from "react"
import type { Participant } from "@/lib/types"

type Props = {
  participant: Participant
  onClose: () => void
  onUpdate: (data: {
    status: "confirmed" | "tentative" | "cancelled"
    invoicedAmount: number
    isPaid: boolean
    notes: string | null
  }) => void | Promise<void>
}

export default function EditParticipantModal({ participant, onClose, onUpdate }: Props) {
  const [status, setStatus] = useState<"confirmed" | "tentative" | "cancelled">(participant.status)
  const [invoicedAmount, setInvoicedAmount] = useState(participant.invoicedAmount.toString())
  const [isPaid, setIsPaid] = useState(participant.isPaid)
  const [notes, setNotes] = useState(participant.notes || "")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    try {
      await onUpdate({
        status,
        invoicedAmount: parseInt(invoicedAmount.replace(/\D/g, ""), 10) || 0,
        isPaid,
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
            <h2 className="font-display text-lg md:text-xl text-white">Redigera deltagare</h2>
            <button onClick={onClose} className="md:hidden text-white/40 hover:text-white text-3xl leading-none px-2">
              ×
            </button>
          </div>

          <div className="mb-4">
            <div className="text-white font-medium">{participant.contact?.fullName}</div>
            {participant.contact?.company?.name && (
              <div className="text-white/40 text-sm">{participant.contact.company.name}</div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Field label="Status">
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="confirmed" className="bg-ink-900">Bekräftad</option>
                <option value="tentative" className="bg-ink-900">Preliminär</option>
                <option value="cancelled" className="bg-ink-900">Avbokad</option>
              </select>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Fakturerat belopp (SEK)">
                <input
                  className="input"
                  inputMode="numeric"
                  value={invoicedAmount}
                  onChange={(e) => setInvoicedAmount(e.target.value)}
                  placeholder="43000"
                />
              </Field>
              <Field label="Betalningsstatus">
                <div className="flex items-center h-full">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-neon focus:ring-neon focus:ring-offset-0"
                    />
                    <span className="text-white text-sm">Betalt</span>
                  </label>
                </div>
              </Field>
            </div>

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
              disabled={submitting}
              className="btn btn-primary touch-target disabled:opacity-40 flex items-center justify-center gap-2 flex-1 md:flex-initial"
            >
              Spara
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
