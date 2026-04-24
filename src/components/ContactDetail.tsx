"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Contact = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  title: string | null
  email: string | null
  phone: string | null
  linkedin: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  company: {
    id: string
    name: string
  } | null
  deals: Array<{
    id: string
    title: string
    value: number
    status: string
    createdAt: string
    owner: {
      name: string
      color: string
      initial: string
    }
    stage: {
      name: string
      status: string | null
    }
  }>
}

type Company = {
  id: string
  name: string
}

export default function ContactDetail({
  contact: initialContact,
  companies,
}: {
  contact: Contact
  companies: Company[]
}) {
  const [contact, setContact] = useState(initialContact)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    title: contact.title || "",
    email: contact.email || "",
    phone: contact.phone || "",
    linkedin: contact.linkedin || "",
    notes: contact.notes || "",
    companyId: contact.company?.id || "",
  })
  const router = useRouter()

  const totalValue = contact.deals.reduce((sum, d) => sum + d.value, 0)
  const wonDeals = contact.deals.filter((d) => d.status === "won")
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0)

  async function handleSave() {
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title || null,
        email: formData.email || null,
        phone: formData.phone || null,
        linkedin: formData.linkedin || null,
        notes: formData.notes || null,
        companyId: formData.companyId || null,
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      setContact(updated)
      setIsEditing(false)
      router.refresh()
    }
  }

  function handleCancel() {
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      title: contact.title || "",
      email: contact.email || "",
      phone: contact.phone || "",
      linkedin: contact.linkedin || "",
      notes: contact.notes || "",
      companyId: contact.company?.id || "",
    })
    setIsEditing(false)
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <Link
          href="/kontakter"
          className="text-white/40 hover:text-white text-sm mb-4 inline-flex items-center gap-2"
        >
          ← Tillbaka till kontakter
        </Link>
        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="font-display text-3xl text-white mb-2">{contact.fullName}</h1>
            <div className="text-white/40 text-sm space-y-1">
              {contact.title && <div>{contact.title}</div>}
              {contact.company && (
                <div>
                  <Link
                    href={`/foretag/${contact.company.id}`}
                    className="hover:text-neon transition-colors"
                  >
                    {contact.company.name}
                  </Link>
                </div>
              )}
              <div>{contact.deals.length} deals</div>
            </div>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Redigera
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel} className="btn">
                Avbryt
              </button>
              <button onClick={handleSave} className="btn-primary">
                Spara
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="glass rounded-xl p-6">
          <div className="text-white/40 text-sm mb-2">Totalt värde</div>
          <div className="text-2xl font-bold text-white">
            {totalValue.toLocaleString("sv-SE")} SEK
          </div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="text-white/40 text-sm mb-2">Vunna deals</div>
          <div className="text-2xl font-bold text-neon">
            {wonDeals.length} st · {wonValue.toLocaleString("sv-SE")} SEK
          </div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="text-white/40 text-sm mb-2">Win rate</div>
          <div className="text-2xl font-bold text-white">
            {contact.deals.length > 0
              ? Math.round((wonDeals.length / contact.deals.length) * 100)
              : 0}
            %
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-xl text-white mb-4">Kontaktinformation</h2>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Förnamn">
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Efternamn">
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Företag">
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="input"
                >
                  <option value="" className="bg-ink-900">Inget företag</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id} className="bg-ink-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Titel">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="t.ex. Inköpschef"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="namn@foretag.se"
                />
              </Field>
              <Field label="Telefon">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="070-123 45 67"
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="input"
                  placeholder="https://linkedin.com/in/..."
                />
              </Field>
              <Field label="Anteckningar">
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Interna anteckningar..."
                />
              </Field>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <InfoRow label="Namn" value={contact.fullName} />
              <InfoRow label="Företag" value={contact.company?.name} companyId={contact.company?.id} />
              <InfoRow label="Titel" value={contact.title} />
              <InfoRow label="Email" value={contact.email} link="mailto" />
              <InfoRow label="Telefon" value={contact.phone} link="tel" />
              <InfoRow label="LinkedIn" value={contact.linkedin} link="url" />
              <InfoRow label="Anteckningar" value={contact.notes} multiline />
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-xl text-white mb-4">
            Deals ({contact.deals.length})
          </h2>
          {contact.deals.length === 0 ? (
            <div className="text-white/40 text-sm">Inga deals ännu</div>
          ) : (
            <div className="space-y-2">
              {contact.deals.map((deal) => {
                const ownerColor = deal.owner.color
                const ownerInitial = deal.owner.initial
                const ownerTextColor = ownerColor === "#deff00" ? "#0a1420" : "white"

                return (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium">{deal.title}</div>
                      <div className="text-white/40 text-xs mt-1">
                        {deal.stage.name} · {new Date(deal.createdAt).toLocaleDateString("sv-SE")}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-white/90 font-semibold">
                        {deal.value.toLocaleString("sv-SE")} SEK
                      </div>
                      <span
                        className="owner-dot w-6 h-6"
                        style={{ background: ownerColor, color: ownerTextColor }}
                        title={deal.owner.name}
                      >
                        {ownerInitial}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function InfoRow({
  label,
  value,
  link,
  multiline,
  companyId,
}: {
  label: string
  value: string | null | undefined
  link?: "mailto" | "tel" | "url"
  multiline?: boolean
  companyId?: string
}) {
  if (!value) {
    return (
      <div className="flex justify-between py-2 border-b border-white/[0.05]">
        <span className="text-white/40">{label}</span>
        <span className="text-white/20">—</span>
      </div>
    )
  }

  return (
    <div className={`flex justify-between py-2 border-b border-white/[0.05] ${multiline ? "flex-col gap-2" : ""}`}>
      <span className="text-white/40">{label}</span>
      {link === "mailto" ? (
        <a href={`mailto:${value}`} className="text-neon hover:underline">
          {value}
        </a>
      ) : link === "tel" ? (
        <a href={`tel:${value}`} className="text-neon hover:underline font-mono">
          {value}
        </a>
      ) : link === "url" ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-neon hover:underline">
          {value}
        </a>
      ) : companyId ? (
        <Link href={`/foretag/${companyId}`} className="text-neon hover:underline">
          {value}
        </Link>
      ) : (
        <span className="text-white/90 whitespace-pre-wrap">{value}</span>
      )}
    </div>
  )
}
