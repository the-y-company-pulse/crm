"use client"

import { useState, useEffect, useRef } from "react"

type Company = {
  id: string
  name: string
  orgNr: string | null
  _count: { deals: number }
}

type Props = {
  value: string | null // company ID
  onChange: (companyId: string | null, companyName: string | null) => void
  placeholder?: string
  allowCreate?: boolean
}

export default function CompanyAutocomplete({
  value,
  onChange,
  placeholder = "Sök företag...",
  allowCreate = true,
}: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fetch company name if value is set
  useEffect(() => {
    if (value && !selectedCompany) {
      fetch(`/api/companies/${value}`)
        .then((res) => res.json())
        .then((company) => {
          setSelectedCompany(company)
          setQuery(company.name)
        })
        .catch(() => {})
    }
  }, [value, selectedCompany])

  // Search companies
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setShowDropdown(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300) // Debounce

    return () => clearTimeout(timer)
  }, [query])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelect(company: Company) {
    setSelectedCompany(company)
    setQuery(company.name)
    onChange(company.id, company.name)
    setShowDropdown(false)
  }

  function handleCreateNew() {
    onChange(null, query)
    setShowDropdown(false)
  }

  function handleClear() {
    setQuery("")
    setSelectedCompany(null)
    onChange(null, null)
    setResults([])
  }

  return (
    <div ref={wrapperRef} className="relative z-10">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedCompany(null)
            onChange(null, null)
          }}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder={placeholder}
          className="input pr-20"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-[100] mt-1 w-full bg-ink-900 rounded-lg border border-white/[0.08] shadow-xl max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-white/40 text-sm">Söker...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3">
              <div className="text-white/40 text-sm mb-2">Inga företag hittades</div>
              {allowCreate && query.length >= 2 && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full text-left px-3 py-2 rounded-lg bg-neon/10 hover:bg-neon/20 text-neon text-sm font-medium"
                >
                  + Skapa nytt: "{query}"
                </button>
              )}
            </div>
          ) : (
            <div>
              {results.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => handleSelect(company)}
                  className="w-full text-left px-4 py-3 hover:bg-white/[0.05] border-b border-white/[0.05] last:border-0"
                >
                  <div className="text-white font-medium">{company.name}</div>
                  <div className="text-white/40 text-xs mt-0.5">
                    {company.orgNr && `${company.orgNr} • `}
                    {company._count.deals} deal{company._count.deals !== 1 ? "s" : ""}
                  </div>
                </button>
              ))}
              {allowCreate && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full text-left px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] text-neon text-sm font-medium border-t border-white/[0.08]"
                >
                  + Skapa nytt: "{query}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
