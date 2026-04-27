"use client"

import { useState, useEffect, useRef } from "react"

type Deal = {
  id: string
  title: string
  company: string | null
  value: number
}

type Props = {
  value: string | null
  onChange: (dealId: string | null) => void
  placeholder?: string
}

export default function DealAutocomplete({ value, onChange, placeholder = "Sök deal..." }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Deal[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Search deals
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/deals/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setShowDropdown(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelect(deal: Deal) {
    setSelectedDeal(deal)
    setQuery(deal.title)
    onChange(deal.id)
    setShowDropdown(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const newQuery = e.target.value
          setQuery(newQuery)
          if (selectedDeal && newQuery !== selectedDeal.title) {
            setSelectedDeal(null)
            onChange(null)
          }
        }}
        onFocus={() => query.length >= 2 && setShowDropdown(true)}
        placeholder={placeholder}
        className="input w-full"
      />

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-ink-900 rounded-lg border border-white/[0.08] shadow-xl max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-white/40 text-sm">Söker...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-white/40 text-sm">Inga deals hittades</div>
          ) : (
            results.map((deal) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => handleSelect(deal)}
                className="w-full text-left px-4 py-3 hover:bg-white/[0.05] border-b border-white/[0.05] last:border-0"
              >
                <div className="text-white font-medium">{deal.title}</div>
                <div className="text-white/40 text-xs mt-0.5">
                  {deal.company} · {deal.value.toLocaleString("sv-SE")} SEK
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
