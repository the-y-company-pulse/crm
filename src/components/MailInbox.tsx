"use client"

import { useState } from "react"
import type { EmailLog } from "@/lib/types"
import DealAutocomplete from "./DealAutocomplete"

type Suggestion = {
  dealId: string
  title: string
  company: string | null
  reason: string
}

type EmailWithSuggestions = EmailLog & {
  suggestions?: Suggestion[]
}

export default function MailInbox({ emails: initialEmails }: { emails: EmailWithSuggestions[] }) {
  const [emails, setEmails] = useState(initialEmails)
  const [selectedDealId, setSelectedDealId] = useState<Record<string, string | null>>({})

  async function matchTo(emailId: string, dealId: string) {
    const res = await fetch(`/api/email-logs/${emailId}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId }),
    })

    if (res.ok) {
      setEmails(emails.filter((e) => e.id !== emailId))
    }
  }

  async function handleMatchFromAutocomplete(emailId: string) {
    const dealId = selectedDealId[emailId]
    if (!dealId) return
    await matchTo(emailId, dealId)
  }

  async function handleIgnore(emailId: string) {
    const res = await fetch(`/api/email-logs/${emailId}/ignore`, {
      method: "POST",
    })

    if (res.ok) {
      setEmails(emails.filter((e) => e.id !== emailId))
    }
  }

  return (
    <div className="px-8 py-8">
      <h1 className="font-display text-3xl text-white mb-2">Mail Inbox</h1>
      <p className="text-white/40 text-sm mb-8">
        {emails.length} mail väntar på att matchas till deals
      </p>

      {emails.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-white/40">Inga obehandlade mail</p>
        </div>
      ) : (
        <div className="space-y-4">
          {emails.map((email) => (
            <div key={email.id} className="glass rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-white font-medium mb-1">{email.subject}</div>
                  <div className="text-white/40 text-sm">
                    Från: {email.from} · {new Date(email.receivedAt).toLocaleString("sv-SE")}
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-lg p-4 mb-4 text-white/60 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                {email.body.substring(0, 500)}
                {email.body.length > 500 && "..."}
              </div>

              {email.suggestions && email.suggestions.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
                    Föreslagna deals
                  </div>
                  <div className="flex flex-col gap-2">
                    {email.suggestions.map((s) => (
                      <button
                        key={s.dealId}
                        onClick={() => matchTo(email.id, s.dealId)}
                        className="text-left bg-neon/5 hover:bg-neon/10 border border-neon/20 hover:border-neon/40 rounded-lg px-4 py-3 transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate">{s.title}</div>
                            <div className="text-white/40 text-xs mt-0.5 truncate">
                              {s.company ? `${s.company} · ` : ""}matchad på {s.reason}
                            </div>
                          </div>
                          <span className="text-neon text-sm font-medium whitespace-nowrap group-hover:text-neon">
                            Matcha →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <div className="flex-1">
                  <DealAutocomplete
                    value={selectedDealId[email.id] || null}
                    onChange={(id) => setSelectedDealId({ ...selectedDealId, [email.id]: id })}
                    placeholder="Eller sök annan deal..."
                  />
                </div>
                <button
                  onClick={() => handleMatchFromAutocomplete(email.id)}
                  disabled={!selectedDealId[email.id]}
                  className="btn btn-primary disabled:opacity-40"
                >
                  Matcha
                </button>
                <button
                  onClick={() => handleIgnore(email.id)}
                  className="btn"
                >
                  Ignorera
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
