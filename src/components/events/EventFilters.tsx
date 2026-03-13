'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ChevronDown, X, SlidersHorizontal } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Venue } from '@/types'

interface EventFiltersProps {
  venues: Venue[]
  totalCount: number
  filteredCount: number
}

export default function EventFilters({ venues, totalCount, filteredCount }: EventFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse current filter state from URL
  const currentVenueIds = searchParams.getAll('venueId')
  const currentArtist = searchParams.get('artist') ?? ''
  const currentDateFrom = searchParams.get('dateFrom') ?? ''
  const currentDateTo = searchParams.get('dateTo') ?? ''
  const currentNeighborhood = searchParams.get('neighborhood') ?? ''

  const [artistInput, setArtistInput] = useState(currentArtist)
  const [venueDropdownOpen, setVenueDropdownOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const venueDropdownRef = useRef<HTMLDivElement>(null)

  const hasActiveFilters =
    currentVenueIds.length > 0 ||
    currentArtist ||
    currentDateFrom ||
    currentDateTo ||
    currentNeighborhood

  // Get unique neighborhoods
  const neighborhoods = Array.from(
    new Set(venues.map(v => v.neighborhood).filter(Boolean))
  ).sort() as string[]

  function updateParams(updates: Record<string, string | string[] | null>) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page') // reset to page 1 on filter change

    for (const [key, value] of Object.entries(updates)) {
      params.delete(key)
      if (value === null) continue
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v))
      } else if (value) {
        params.set(key, value)
      }
    }

    router.push(`/events?${params.toString()}`)
  }

  // Debounced artist search
  const handleArtistChange = useCallback((value: string) => {
    setArtistInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ artist: value || null })
    }, 300)
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleVenue(venueId: string) {
    const next = currentVenueIds.includes(venueId)
      ? currentVenueIds.filter(id => id !== venueId)
      : [...currentVenueIds, venueId]
    updateParams({ venueId: next.length > 0 ? next : null })
  }

  function clearAll() {
    router.push('/events')
    setArtistInput('')
  }

  // Close venue dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (venueDropdownRef.current && !venueDropdownRef.current.contains(e.target as Node)) {
        setVenueDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const FilterContent = (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Artist search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search artists..."
          value={artistInput}
          onChange={e => handleArtistChange(e.target.value)}
          className="w-full bg-surface-800 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {artistInput && (
          <button
            onClick={() => handleArtistChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Venue dropdown */}
      <div ref={venueDropdownRef} className="relative">
        <button
          onClick={() => setVenueDropdownOpen(!venueDropdownOpen)}
          className={`
            flex items-center gap-2 bg-surface-800 border rounded-lg px-3 py-2 text-sm transition-colors
            ${currentVenueIds.length > 0
              ? 'border-brand-500 text-brand-500'
              : 'border-white/10 text-white/70 hover:text-white'
            }
          `}
        >
          Venues
          {currentVenueIds.length > 0 && (
            <span className="bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {currentVenueIds.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${venueDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {venueDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-surface-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-2 max-h-72 overflow-y-auto">
              {venues.map(venue => (
                <label
                  key={venue.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={currentVenueIds.includes(venue.id)}
                    onChange={() => toggleVenue(venue.id)}
                    className="accent-brand-500"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{venue.name}</p>
                    {venue.neighborhood && (
                      <p className="text-xs text-white/40">{venue.neighborhood}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {currentVenueIds.length > 0 && (
              <div className="border-t border-white/10 p-2">
                <button
                  onClick={() => updateParams({ venueId: null })}
                  className="text-xs text-brand-500 hover:text-brand-400 w-full text-center py-1"
                >
                  Clear venue filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date from */}
      <input
        type="date"
        value={currentDateFrom}
        onChange={e => updateParams({ dateFrom: e.target.value || null })}
        className="bg-surface-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:text-white"
        placeholder="From date"
        title="From date"
      />

      {/* Date to */}
      <input
        type="date"
        value={currentDateTo}
        onChange={e => updateParams({ dateTo: e.target.value || null })}
        className="bg-surface-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:text-white"
        placeholder="To date"
        title="To date"
      />

      {/* Neighborhood filter */}
      <select
        value={currentNeighborhood}
        onChange={e => updateParams({ neighborhood: e.target.value || null })}
        className="bg-surface-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">All neighborhoods</option>
        {neighborhoods.map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      {/* Clear all */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-brand-500 hover:text-brand-400">
          <X className="w-4 h-4" />
          Clear all
        </Button>
      )}
    </div>
  )

  return (
    <div className="sticky top-16 z-40 bg-surface-900/95 backdrop-blur border-b border-white/5 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop filters */}
        <div className="hidden md:block">
          {FilterContent}
        </div>

        {/* Mobile: toggle button + count */}
        <div className="md:hidden flex items-center justify-between">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>
          <span className="text-sm text-white/50">
            Showing {filteredCount} of {totalCount}
          </span>
        </div>

        {/* Mobile filters drawer */}
        {mobileFiltersOpen && (
          <div className="md:hidden mt-4 space-y-3">
            {FilterContent}
          </div>
        )}

        {/* Desktop count */}
        <div className="hidden md:block mt-3 text-sm text-white/40">
          Showing {filteredCount} of {totalCount} events
        </div>
      </div>
    </div>
  )
}
