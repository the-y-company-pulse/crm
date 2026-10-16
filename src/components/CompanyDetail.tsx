"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import NewContactModal from "./NewContactModal"
import CompanyRadarPanel from "./CompanyRadarPanel"
import CompanyActivityLog from "./CompanyActivityLog"
import CompanyProfilePanel from "./CompanyProfilePanel"
import { ownerBg, ownerText } from "@/lib/ownerColor";
import { RADAR_REGIONS, type RadarStatus } from "@/lib/radar-constants"
import type { Activity, User } from "@/lib/types"

type Company = {
  id: string
  name: string
  nameNorm: string
  orgNr: string | null
  industry: string | null
  website: string | null
  address: string | null
  city: string | null
  region: string | null
  employees: number | null
  employeesNote: string | null
  switchboard: string | null
  email: string | null
  emailPattern: string | null
  notes: string | null
  ownerId: string | null
  owner: User | null
  gapAmbition: number | null
  gapDrive: number | null
  gapRationale: string | null
  gapAssessedAt: string | null
  fiscalYear: number | null
  revenueMsek: number | null
  operatingProfitMsek: number | null
  operatingProfitPrevMsek: number | null
  operatingMarginPct: number | null
  equityRatioPct: number | null
  quickRatioPct: number | null
  managers: number | null
  distanceKm: number | null
  createdAt: string
  updatedAt: string
  signals: Array<{
    id: string
    radar: string
    type: string
    summary: string
    eventDate: string | null
    sourceName: string | null
    sourceUrl: string | null
    strength: string | null
    angle: string | null
    status: RadarStatus
    createdAt: string
  }>
  activities: Activity[]
  deals: Array<{
    id: string
    title: string
    value: number
    status: string
    createdAt: string
    activities?: Activity[]
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
  contacts: Array<{
    id: string
    fullName: string
    email: string | null
    phone: string | null
    title: string | null
  }>
}

export default function CompanyDetail({ company: initialCompany, users }: { company: Company; users: User[] }) {
  const [company, setCompany] = useState(initialCompany)
  const [isEditing, setIsEditing] = useState(false)
  const [showNewContactModal, setShowNewContactModal] = useState(false)
  const [formData, setFormData] = useState(() => toForm(initialCompany))
  const [saveError, setSaveError] = useState<string | null>(null)
  const router = useRouter()

  const totalValue = company.deals.reduce((sum, d) => sum + d.value, 0)
  const wonDeals = company.deals.filter((d) => d.status === "won")
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0)

  async function handleSave() {
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgNr: formData.orgNr || null,
        industry: formData.industry || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city || null,
        region: formData.region || null,
        employees: formData.employees ? parseInt(formData.employees, 10) : null,
        employeesNote: formData.employeesNote || null,
        switchboard: formData.switchboard || null,
        email: formData.email || null,
        emailPattern: formData.emailPattern || null,
        notes: formData.notes || null,
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      setCompany(updated)
      setFormData(toForm(updated))
      setSaveError(null)
      setIsEditing(false)
      router.refresh()
    } else {
      const data = await res.json().catch(() => null)
      setSaveError(typeof data?.error === "string" ? data.error : "Kunde inte spara")
    }
  }

  async function handleOwnerChange(ownerId: string) {
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: ownerId || null }),
    })
    if (res.ok) setCompany(await res.json())
  }

  function handleCancel() {
    setFormData(toForm(company))
    setSaveError(null)
    setIsEditing(false)
  }

  async function handleCreateContact(data: any) {
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        fullName: `${data.firstName} ${data.lastName}`,
        companyId: company.id,
      }),
    })
    if (!res.ok) return
    const created = await res.json()
    setCompany({
      ...company,
      contacts: [...company.contacts, created],
    })
    setShowNewContactModal(false)
    router.refresh()
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <Link
          href="/foretag"
          className="text-white/40 hover:text-white text-sm mb-4 inline-flex items-center gap-2"
        >
          ← Tillbaka till företag
        </Link>
        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="font-display text-3xl text-white mb-2">{company.name}</h1>
            <div className="text-white/40 text-sm space-y-1">
              <div>{company.deals.length} deals · {company.contacts.length} kontakter</div>
              {company.orgNr && <div>Org.nr: {company.orgNr}</div>}
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm">
              <span className="text-white/40">Ansvarig</span>
              {company.owner && (
                <span
                  className="owner-dot w-6 h-6"
                  style={{ background: ownerBg(company.owner.color), color: ownerText(ownerBg(company.owner.color)) }}
                >
                  {company.owner.initial}
                </span>
              )}
              <select
                value={company.ownerId ?? ""}
                onChange={(e) => handleOwnerChange(e.target.value)}
                className="input w-auto py-1.5 px-3 text-sm"
                aria-label="Ansvarig"
              >
                <option value="">Ingen</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
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
            {company.deals.length > 0
              ? Math.round((wonDeals.length / company.deals.length) * 100)
              : 0}
            %
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-xl text-white mb-4">Företagsinformation</h2>
          {isEditing ? (
            <div className="space-y-4">
              <Field label="Org.nr">
                <input
                  type="text"
                  value={formData.orgNr}
                  onChange={(e) => setFormData({ ...formData, orgNr: e.target.value })}
                  className="input"
                  placeholder="XXXXXX-XXXX"
                />
              </Field>
              <Field label="Bransch">
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="input"
                  placeholder="t.ex. Detaljhandel"
                />
              </Field>
              <Field label="Webbplats">
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </Field>
              <Field label="Adress">
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  placeholder="Gata, postnummer, ort"
                />
              </Field>
              <Field label="Ort">
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Region">
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="input"
                >
                  <option value="">—</option>
                  {RADAR_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Antal anställda">
                <input
                  type="number"
                  value={formData.employees}
                  onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                  className="input"
                  placeholder="0"
                />
              </Field>
              <Field label="Anställda (osäker uppgift)">
                <input
                  type="text"
                  value={formData.employeesNote}
                  onChange={(e) => setFormData({ ...formData, employeesNote: e.target.value })}
                  className="input"
                  placeholder="t.ex. ca 130–150"
                />
              </Field>
              <Field label="Växel">
                <input
                  type="tel"
                  value={formData.switchboard}
                  onChange={(e) => setFormData({ ...formData, switchboard: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Allmän e-post">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="info@..."
                />
              </Field>
              <Field label="E-postmönster (inte en adress)">
                <input
                  type="text"
                  value={formData.emailPattern}
                  onChange={(e) => setFormData({ ...formData, emailPattern: e.target.value })}
                  className="input"
                  placeholder="fornamn.efternamn@bolag.se"
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
              {saveError && <div className="text-sm text-[rgb(var(--c-lost))]">{saveError}</div>}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <InfoRow label="Org.nr" value={company.orgNr} />
              <InfoRow label="Bransch" value={company.industry} />
              <InfoRow label="Webbplats" value={company.website} link />
              <InfoRow label="Adress" value={company.address} />
              <InfoRow label="Ort" value={company.city} />
              <InfoRow label="Region" value={company.region} />
              <InfoRow label="Anställda" value={company.employees?.toString() ?? company.employeesNote} />
              <InfoRow label="Växel" value={company.switchboard} />
              <InfoRow label="Allmän e-post" value={company.email} />
              <InfoRow label="E-postmönster" value={company.emailPattern} />
              <InfoRow label="Anteckningar" value={company.notes} multiline />
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-white">
              Kontakter ({company.contacts.length})
            </h2>
            <button onClick={() => setShowNewContactModal(true)} className="btn btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Lägg till kontakt
            </button>
          </div>
          {company.contacts.length === 0 ? (
            <div className="text-white/40 text-sm">Inga kontakter ännu</div>
          ) : (
            <div className="space-y-3">
              {company.contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/kontakter/${contact.id}`}
                  className="block p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="text-white font-medium">{contact.fullName}</div>
                  {contact.title && (
                    <div className="text-white/40 text-xs mt-0.5">{contact.title}</div>
                  )}
                  {(contact.email || contact.phone) && (
                    <div className="text-white/60 text-xs mt-1 space-x-2">
                      {contact.email && <span>{contact.email}</span>}
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-xl p-6 mt-6">
        <h2 className="font-display text-xl text-white mb-4">
          Deals ({company.deals.length})
        </h2>
        {company.deals.length === 0 ? (
          <div className="text-white/40 text-sm">Inga deals ännu</div>
        ) : (
          <div className="space-y-2">
            {company.deals.map((deal) => {
              const ownerColor = ownerBg(deal.owner.color)
              const ownerInitial = deal.owner.initial
              const ownerTextColor = ownerText(ownerColor)

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

      {(company.signals.length > 0 || company.gapAmbition || company.gapDrive) && (
        <CompanyRadarPanel
          companyId={company.id}
          signals={company.signals}
          gap={{
            gapAmbition: company.gapAmbition,
            gapDrive: company.gapDrive,
            gapRationale: company.gapRationale,
            gapAssessedAt: company.gapAssessedAt,
          }}
        />
      )}

      <CompanyProfilePanel companyId={company.id} company={company} />

      <CompanyActivityLog companyId={company.id} activities={company.activities} deals={company.deals} />

      {showNewContactModal && (
        <NewContactModal
          onClose={() => setShowNewContactModal(false)}
          onCreate={handleCreateContact}
        />
      )}
    </div>
  )
}

function toForm(c: Company) {
  return {
    orgNr: c.orgNr || "",
    industry: c.industry || "",
    website: c.website || "",
    address: c.address || "",
    city: c.city || "",
    region: c.region || "",
    employees: c.employees?.toString() || "",
    employeesNote: c.employeesNote || "",
    switchboard: c.switchboard || "",
    email: c.email || "",
    emailPattern: c.emailPattern || "",
    notes: c.notes || "",
  }
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
}: {
  label: string
  value: string | null | undefined
  link?: boolean
  multiline?: boolean
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
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neon hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="text-white/90 whitespace-pre-wrap">{value}</span>
      )}
    </div>
  )
}
