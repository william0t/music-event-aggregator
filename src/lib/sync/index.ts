import { createClient } from '@supabase/supabase-js'
import { fetchTicketmasterEvents } from './ticketmaster'
import { fetchBandsintownEventsBatch } from './bandsintown'
import type { Event, SyncResult, TMEvent, BITEvent } from '@/types'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── MAIN SYNC ENTRY POINT ───────────────────────────────────────────────────

export async function runFullSync(): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  // 1. Ticketmaster sync
  try {
    const tmResult = await syncTicketmaster()
    results.push(tmResult)
  } catch (err) {
    results.push({ source: 'ticketmaster', eventsUpserted: 0, eventsSkipped: 0, errors: [String(err)] })
  }

  // 2. Bandsintown sync
  try {
    const bitResult = await syncBandsintown()
    results.push(bitResult)
  } catch (err) {
    results.push({ source: 'bandsintown', eventsUpserted: 0, eventsSkipped: 0, errors: [String(err)] })
  }

  return results
}

// ─── TICKETMASTER SYNC ────────────────────────────────────────────────────────

async function syncTicketmaster(): Promise<SyncResult> {
  const supabase = getServiceClient()
  const result: SyncResult = { source: 'ticketmaster', eventsUpserted: 0, eventsSkipped: 0, errors: [] }

  const tmEvents = await fetchTicketmasterEvents()
  console.log(`TM: fetched ${tmEvents.length} events`)

  // Get all venues with TM IDs
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, ticketmaster_venue_id')
    .eq('scrape_strategy', 'ticketmaster')

  const venueMap = new Map<string, string>() // TM venue ID → our venue UUID
  for (const v of (venues ?? [])) {
    if (v.ticketmaster_venue_id) venueMap.set(v.ticketmaster_venue_id, v.id)
  }

  for (const tmEvent of tmEvents) {
    try {
      const tmVenues = tmEvent._embedded?.venues ?? []
      const matchedVenueId = tmVenues
        .map((v: { id: string; name: string }) => venueMap.get(v.id))
        .find((id: string | undefined) => id !== undefined)

      if (!matchedVenueId) {
        result.eventsSkipped++
        continue
      }

      const attraction = tmEvent._embedded?.attractions?.[0]
      const genre = attraction?.classifications?.[0]?.genre?.name ?? null
      const image = tmEvent.images?.find((i: { ratio: string; width: number }) => i.ratio === '16_9' && i.width > 500)
      const priceRange = tmEvent.priceRanges?.[0]

      const eventToUpsert: Omit<Event, 'id' | 'created_at' | 'updated_at'> = {
        title: tmEvent.name,
        artist_name: attraction?.name ?? tmEvent.name,
        supporting_acts: tmEvent._embedded?.attractions?.slice(1).map((a: { name: string }) => a.name) ?? null,
        venue_id: matchedVenueId,
        event_date: tmEvent.dates.start.localDate,
        doors_time: null,
        start_time: tmEvent.dates.start.localTime ?? null,
        ticket_url: tmEvent.url,
        price_min: priceRange?.min ?? null,
        price_max: priceRange?.max ?? null,
        image_url: (image as { url: string } | undefined)?.url ?? null,
        description: tmEvent.info ?? null,
        genre,
        source: 'ticketmaster',
        external_id: tmEvent.id,
        is_cancelled: tmEvent.dates.status.code === 'cancelled',
        is_sold_out: tmEvent.dates.status.code === 'offsale',
      }

      const { error } = await supabase
        .from('events')
        .upsert(eventToUpsert, { onConflict: 'external_id,source' })

      if (error) {
        result.errors.push(`TM upsert error for ${tmEvent.id}: ${error.message}`)
      } else {
        result.eventsUpserted++
      }
    } catch (err) {
      result.errors.push(`TM processing error: ${String(err)}`)
    }
  }

  return result
}

// ─── BANDSINTOWN SYNC ─────────────────────────────────────────────────────────

async function syncBandsintown(): Promise<SyncResult> {
  const supabase = getServiceClient()
  const result: SyncResult = { source: 'bandsintown', eventsUpserted: 0, eventsSkipped: 0, errors: [] }

  // Get all BIT-strategy venues
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, slug')
    .eq('scrape_strategy', 'bandsintown')
    .eq('is_active', true)

  if (!venues?.length) return result

  // Build a name→id map for fuzzy venue matching
  const venueNameMap = new Map<string, string>()
  for (const v of venues) {
    venueNameMap.set(v.name.toLowerCase(), v.id)
  }

  // Fetch events from BIT using venue names as search terms
  const allBitEvents = await fetchBandsintownEventsBatch(venues.map((v: { name: string }) => v.name))

  for (const bitEvent of allBitEvents) {
    try {
      const venueNameKey = bitEvent.venue?.name?.toLowerCase() ?? ''
      // Try exact match first, then partial
      let matchedVenueId = venueNameMap.get(venueNameKey)
      if (!matchedVenueId) {
        for (const entry of Array.from(venueNameMap.entries())) {
          const [key, id] = entry
          if (venueNameKey.includes(key) || key.includes(venueNameKey)) {
            matchedVenueId = id
            break
          }
        }
      }

      if (!matchedVenueId) {
        result.eventsSkipped++
        continue
      }

      const eventDate = new Date(bitEvent.datetime)
      const dateStr = eventDate.toISOString().split('T')[0]
      const timeStr = eventDate.toTimeString().split(' ')[0]

      const eventToUpsert: Omit<Event, 'id' | 'created_at' | 'updated_at'> = {
        title: bitEvent.title || bitEvent.artist?.name || bitEvent.lineup[0],
        artist_name: bitEvent.artist?.name ?? bitEvent.lineup[0] ?? 'Unknown Artist',
        supporting_acts: bitEvent.lineup.slice(1),
        venue_id: matchedVenueId,
        event_date: dateStr,
        doors_time: null,
        start_time: timeStr,
        ticket_url: bitEvent.offers?.[0]?.url ?? null,
        price_min: null,
        price_max: null,
        image_url: bitEvent.artist?.image_url ?? null,
        description: bitEvent.description ?? null,
        genre: null,
        source: 'bandsintown',
        external_id: String(bitEvent.id),
        is_cancelled: false,
        is_sold_out: false,
      }

      const { error } = await supabase
        .from('events')
        .upsert(eventToUpsert, { onConflict: 'external_id,source' })

      if (error) {
        result.errors.push(`BIT upsert error for ${bitEvent.id}: ${error.message}`)
      } else {
        result.eventsUpserted++
      }
    } catch (err) {
      result.errors.push(`BIT processing error: ${String(err)}`)
    }
  }

  return result
}
