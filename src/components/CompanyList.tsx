"use client"

import { useState } from "react"
import Link from "next/link"

type Company = {
  id: string
  name: string
  orgNr: string | null
  industry: string | null
  website: string | null
  createdAt: string
  _count: {
    deals: number
    contacts: number
  }
}

export default function CompanyList({ companies: initialCompanies }: { companies: Company[] }) {
  const [companies] = useState(initialCompanies)
  const [search, setSearch] = useState("")

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.orgNr?.includes(search) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  )

  const totalDeals = companies.reduce((sum, c) => sum + c._count.deals, 0)
  const totalContacts = companies.reduce((sum, c) => sum + c._count.contacts, 0)

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white mb-2">Företag</h1>
          <div className="text-white/40 text-sm">
            {companies.length} företag · {totalDeals} deals · {totalContacts} kontakter
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök företag..."
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Företag</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Org.nr</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Bransch</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Deals</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Kontakter</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Skapad</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                  {search ? "Inga företag hittades" : "Inga företag ännu"}
                </td>
              </tr>
            ) : (
              filtered.map((company) => (
                <tr
                  key={company.id}
                  className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/foretag/${company.id}`}
                      className="text-white font-medium hover:text-neon transition-colors"
                    >
                      {company.name}
                    </Link>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-white/40 hover:text-white text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ↗
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm font-mono">
                    {company.orgNr || "—"}
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm">
                    {company.industry || "—"}
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm">
                    {company._count.deals}
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm">
                    {company._count.contacts}
                  </td>
                  <td className="px-6 py-4 text-white/40 text-sm">
                    {new Date(company.createdAt).toLocaleDateString("sv-SE")}
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
