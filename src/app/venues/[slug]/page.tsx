import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, MapPin, Users, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import EventList from '@/components/events/EventList'
import { todayISODate } from '@/lib/utils/dates'
import type { EventWithVenue } from '@/types'

function deduplicateEvents(events: EventWithVenue[]): EventWithVenue[] {
  const seen = new Map<string, EventWithVenue>()
  for (const event of events) {
    const key = `${event.venue_id}|${event.event_date}|${event.artist_name.toLowerCase()}`
    const existing = seen.get(key)
    if (!existing || (!existing.start_time && event.start_time)) {
      seen.set(key, event)
    }
  }
  return Array.from(seen.values())
}

interface VenuePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: VenuePageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: venue } = await supabase
    .from('venues')
    .select('name, neighborhood, city')
    .eq('slug', slug)
    .single()

  if (!venue) return { title: 'Venue Not Found' }

  return {
    title: `${venue.name} — Denver Live Music`,
    description: `Upcoming shows at ${venue.name} in ${venue.neighborhood ?? venue.city}, Denver.`,
  }
}

export default async function VenuePage({ params }: VenuePageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const today = todayISODate()

  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!venue) notFound()

  const { data: events, count } = await supabase
    .from('events')
    .select('*, venues(*)', { count: 'exact' })
    .eq('venue_id', venue.id)
    .gte('event_date', today)
    .eq('is_cancelled', false)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-white/40 mb-6">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/venues" className="hover:text-white transition-colors">Venues</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white/70">{venue.name}</span>
      </nav>

      {/* Venue header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">{venue.name}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-white/60">
          {venue.neighborhood && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-500" />
              <span>{venue.neighborhood}, {venue.city}, {venue.state}</span>
            </div>
          )}
          {venue.address && (
            <span>{venue.address}</span>
          )}
          {venue.capacity && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Capacity: {venue.capacity.toLocaleString()}</span>
            </div>
          )}
          {venue.website_url && (
            <a
              href={venue.website_url.startsWith('http') ? venue.website_url : `https://${venue.website_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-brand-500 hover:text-brand-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Website
            </a>
          )}
        </div>
      </div>

      {/* Events at this venue */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">
          Upcoming Shows
          {count !== null && count > 0 && (
            <span className="ml-3 text-sm font-normal text-white/40">{count} show{count !== 1 ? 's' : ''}</span>
          )}
        </h2>

        <EventList
          events={deduplicateEvents((events ?? []) as EventWithVenue[])}
          totalCount={count ?? 0}
          currentPage={1}
          pageSize={count ?? 0}
          searchParams={{}}
        />
      </div>
    </div>
  )
}
