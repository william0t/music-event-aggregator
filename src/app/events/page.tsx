import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EventList from '@/components/events/EventList'
import EventFilters from '@/components/events/EventFilters'
import { EventCardSkeleton } from '@/components/ui/LoadingSpinner'
import { todayISODate } from '@/lib/utils/dates'
import type { EventWithVenue, Venue } from '@/types'

const PAGE_SIZE = 20

interface SearchParams {
  venueId?: string | string[]
  artist?: string
  dateFrom?: string
  dateTo?: string
  neighborhood?: string
  page?: string
}

interface EventsPageProps {
  searchParams: Promise<SearchParams>
}

function EventListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}

async function EventsContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const today = todayISODate()

  // Parse filters
  const venueIds = searchParams.venueId
    ? Array.isArray(searchParams.venueId)
      ? searchParams.venueId
      : [searchParams.venueId]
    : []
  const artist = searchParams.artist ?? ''
  const dateFrom = searchParams.dateFrom ?? null
  const dateTo = searchParams.dateTo ?? null
  const neighborhood = searchParams.neighborhood ?? null
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // Build query
  let query = supabase
    .from('events')
    .select('*, venues(*)', { count: 'exact' })
    .gte('event_date', today)
    .eq('is_cancelled', false)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (venueIds.length > 0) query = query.in('venue_id', venueIds)
  if (artist) query = query.ilike('artist_name', `%${artist}%`)
  if (dateFrom) query = query.gte('event_date', dateFrom)
  if (dateTo) query = query.lte('event_date', dateTo)

  query = query.range(offset, offset + PAGE_SIZE - 1)

  const { data: events, count, error } = await query

  if (error) {
    return (
      <div className="text-red-400 text-center py-12">
        Failed to load events. Please try again later.
      </div>
    )
  }

  // Post-filter by neighborhood (Supabase can't easily filter on joined table column in count query)
  let filteredEvents = (events ?? []) as EventWithVenue[]
  if (neighborhood) {
    filteredEvents = filteredEvents.filter(e => e.venues?.neighborhood === neighborhood)
  }

  // Deduplicate: TM sometimes lists the same show under two venue names (e.g. "Summit Music Hall"
  // and "Moon Room at Summit"). Keep the event with more complete data (has start_time wins).
  const seen = new Map<string, EventWithVenue>()
  for (const event of filteredEvents) {
    const key = `${event.venue_id}|${event.event_date}|${event.artist_name.toLowerCase()}`
    const existing = seen.get(key)
    if (!existing || (!existing.start_time && event.start_time)) {
      seen.set(key, event)
    }
  }
  filteredEvents = Array.from(seen.values())

  const totalCount = count ?? 0

  return (
    <EventList
      events={filteredEvents}
      totalCount={totalCount}
      currentPage={page}
      pageSize={PAGE_SIZE}
      searchParams={Object.fromEntries(
        Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v ?? ''])
      )}
    />
  )
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const supabase = await createClient()
  const resolvedSearchParams = await searchParams

  // Fetch all venues for the filter dropdown
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, slug, neighborhood, city, state, capacity, website_url, image_url, ticketmaster_venue_id, scrape_url, scrape_strategy, is_active, created_at, updated_at, address')
    .eq('is_active', true)
    .order('name')

  // Get total event count for display
  const today = todayISODate()
  const { count: totalCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('event_date', today)
    .eq('is_cancelled', false)

  // Get filtered count
  const venueIds = resolvedSearchParams.venueId
    ? Array.isArray(resolvedSearchParams.venueId)
      ? resolvedSearchParams.venueId
      : [resolvedSearchParams.venueId]
    : []
  const artist = resolvedSearchParams.artist ?? ''
  const dateFrom = resolvedSearchParams.dateFrom ?? null
  const dateTo = resolvedSearchParams.dateTo ?? null

  let filteredQuery = supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('event_date', today)
    .eq('is_cancelled', false)

  if (venueIds.length > 0) filteredQuery = filteredQuery.in('venue_id', venueIds)
  if (artist) filteredQuery = filteredQuery.ilike('artist_name', `%${artist}%`)
  if (dateFrom) filteredQuery = filteredQuery.gte('event_date', dateFrom)
  if (dateTo) filteredQuery = filteredQuery.lte('event_date', dateTo)

  const { count: filteredCount } = await filteredQuery

  return (
    <div className="min-h-screen bg-surface-900">
      <EventFilters
        venues={(venues ?? []) as Venue[]}
        totalCount={totalCount ?? 0}
        filteredCount={filteredCount ?? 0}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<EventListSkeleton />}>
          <EventsContent searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </div>
  )
}
