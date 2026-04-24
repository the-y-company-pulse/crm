"use client"

import { useState } from "react"
import Link from "next/link"

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
  const [contacts] = useState(initialContacts)
  const [search, setSearch] = useState("")

  const filtered = contacts.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.company?.name.toLowerCase().includes(search.toLowerCase()) ||
    c.title?.toLowerCase().includes(search.toLowerCase())
  )

  const totalDeals = contacts.reduce((sum, c) => sum + c._count.deals, 0)
  const withCompany = contacts.filter((c) => c.company).length

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white mb-2">Kontakter</h1>
          <div className="text-white/40 text-sm">
            {contacts.length} kontakter · {withCompany} med företag · {totalDeals} deals
          </div>
        </div>
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
    </div>
  )
}
