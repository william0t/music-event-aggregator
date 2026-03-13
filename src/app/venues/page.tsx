import { createClient } from '@/lib/supabase/server'
import VenueGrid from '@/components/venues/VenueGrid'
import { todayISODate } from '@/lib/utils/dates'
import type { Venue } from '@/types'

export const metadata = {
  title: 'Venues — Denver Live Music',
  description: 'Explore all live music venues in the Denver metro area.',
}

export default async function VenuesPage() {
  const supabase = await createClient()
  const today = todayISODate()

  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .eq('is_active', true)
    .order('name')

  // Get upcoming event counts per venue
  const { data: eventCounts } = await supabase
    .from('events')
    .select('venue_id')
    .gte('event_date', today)
    .eq('is_cancelled', false)

  const countMap = new Map<string, number>()
  for (const row of (eventCounts ?? [])) {
    countMap.set(row.venue_id, (countMap.get(row.venue_id) ?? 0) + 1)
  }

  const venuesWithCounts = (venues ?? []).map((v: Venue) => ({
    ...v,
    upcomingCount: countMap.get(v.id) ?? 0,
  }))

  // Sort: venues with upcoming events first, then alphabetical
  venuesWithCounts.sort((a, b) => {
    if (b.upcomingCount !== a.upcomingCount) return b.upcomingCount - a.upcomingCount
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Denver Venues</h1>
        <p className="text-white/50 mt-2">
          {venues?.length ?? 0} venues across the Denver metro area
        </p>
      </div>

      <VenueGrid venues={venuesWithCounts} />
    </div>
  )
}
