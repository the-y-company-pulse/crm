"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/useMediaQuery"
import NewContactModal from "./NewContactModal"

type Contact = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  title: string | null
  email: string | null
  phone: string | null
  linkedin: string | null
  createdAt: string
  company: {
    id: string
    name: string
  } | null
  _count: {
    deals: number
  }
}

export default function ContactList({ contacts: initialContacts }: { contacts: Contact[] }) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const [contacts, setContacts] = useState(initialContacts)
  const [search, setSearch] = useState("")
  const [showNewModal, setShowNewModal] = useState(false)

  const filtered = contacts.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.company?.name.toLowerCase().includes(search.toLowerCase()) ||
    c.title?.toLowerCase().includes(search.toLowerCase())
  )

  const totalDeals = contacts.reduce((sum, c) => sum + c._count.deals, 0)
  const withCompany = contacts.filter((c) => c.company).length

  async function handleCreate(data: any) {
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        fullName: `${data.firstName} ${data.lastName}`,
      }),
    })
    if (!res.ok) return
    const created = await res.json()
    setContacts([created, ...contacts])
    setShowNewModal(false)
    router.refresh()
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="px-4 py-4">
        <div className="mb-4">
          <h1 className="font-display text-2xl text-white mb-2">Kontakter</h1>
          <div className="text-white/40 text-xs">
            {contacts.length} kontakter · {withCompany} med företag · {totalDeals} deals
          </div>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök kontakter..."
            className="input w-full"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-2xl"
            >
              ×
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-white/40 text-center py-12 text-sm">
            {search ? "Inga kontakter hittades" : "Inga kontakter ännu"}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((contact) => (
              <Link
                key={contact.id}
                href={`/kontakter/${contact.id}`}
                className="bg-navy/80 border border-white/[0.15] rounded-lg p-4 touch-target transition-all hover:bg-navy active:bg-navy/90"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-white mb-1">{contact.fullName}</h3>
                    {contact.title && (
                      <p className="text-xs text-white/40 mb-1">{contact.title}</p>
                    )}
                    {contact.company && (
                      <p className="text-sm text-white/60">{contact.company.name}</p>
                    )}
                  </div>
                  {contact.linkedin && (
                    <a
                      href={contact.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 hover:text-white text-sm flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      title="LinkedIn"
                    >
                      in
                    </a>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-xs text-white/50">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="hover:text-neon transition-colors truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="hover:text-neon transition-colors font-mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {contact.phone}
                    </a>
                  )}
                </div>

                {contact._count.deals > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.08] text-xs text-white/40">
                    {contact._count.deals} deal{contact._count.deals !== 1 ? 's' : ''}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {showNewModal && (
          <NewContactModal
            onClose={() => setShowNewModal(false)}
            onCreate={handleCreate}
          />
        )}

        {/* FAB */}
        <button onClick={() => setShowNewModal(true)} className="fab">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    )
  }

  // Desktop table view
  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white mb-2">Kontakter</h1>
          <div className="text-white/40 text-sm">
            {contacts.length} kontakter · {withCompany} med företag · {totalDeals} deals
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök kontakter..."
              className="input w-80"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ny kontakt
          </button>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/[0.05] border-b border-white/[0.08]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Namn</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Företag</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Titel</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Telefon</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Deals</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                  {search ? "Inga kontakter hittades" : "Inga kontakter ännu"}
                </td>
              </tr>
            ) : (
              filtered.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/kontakter/${contact.id}`}
                      className="text-white font-medium hover:text-neon transition-colors"
                    >
                      {contact.fullName}
                    </Link>
                    {contact.linkedin && (
                      <a
                        href={contact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-white/40 hover:text-white text-xs"
                        onClick={(e) => e.stopPropagation()}
                        title="LinkedIn"
                      >
                        in
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {contact.company ? (
                      <Link
                        href={`/foretag/${contact.company.id}`}
                        className="text-white/60 hover:text-neon text-sm transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact.company.name}
                      </Link>
                    ) : (
                      <span className="text-white/20 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm">
                    {contact.title || "—"}
                  </td>
                  <td className="px-6 py-4">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-white/60 hover:text-neon text-sm transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-white/20 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-white/60 hover:text-neon text-sm transition-colors font-mono"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact.phone}
                      </a>
                    ) : (
                      <span className="text-white/20 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm">
                    {contact._count.deals}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <NewContactModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
