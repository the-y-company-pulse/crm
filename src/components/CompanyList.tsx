"use client"

import { useState } from "react"
import Link from "next/link"
import { useIsMobile } from "@/hooks/useMediaQuery"

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
  const isMobile = useIsMobile()
  const [companies] = useState(initialCompanies)
  const [search, setSearch] = useState("")

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.orgNr?.includes(search) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  )

  const totalDeals = companies.reduce((sum, c) => sum + c._count.deals, 0)
  const totalContacts = companies.reduce((sum, c) => sum + c._count.contacts, 0)

  // Mobile card view
  if (isMobile) {
    return (
      <div className="px-4 py-4">
        <div className="mb-4">
          <h1 className="font-display text-2xl text-white mb-2">Företag</h1>
          <div className="text-white/40 text-xs">
            {companies.length} företag · {totalDeals} deals · {totalContacts} kontakter
          </div>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök företag..."
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
            {search ? "Inga företag hittades" : "Inga företag ännu"}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((company) => (
              <Link
                key={company.id}
                href={`/foretag/${company.id}`}
                className="bg-navy/80 border border-white/[0.15] rounded-lg p-4 touch-target transition-all hover:bg-navy active:bg-navy/90"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-white mb-1 truncate">{company.name}</h3>
                    {company.orgNr && (
                      <p className="text-xs text-white/40 font-mono">{company.orgNr}</p>
                    )}
                  </div>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 hover:text-white text-lg flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ↗
                    </a>
                  )}
                </div>

                {company.industry && (
                  <p className="text-sm text-white/60 mb-3">{company.industry}</p>
                )}

                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="flex gap-3">
                    <span>{company._count.deals} deals</span>
                    <span>{company._count.contacts} kontakter</span>
                  </div>
                  <span>{new Date(company.createdAt).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Desktop table view
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
