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

  // Log unique venue names from TM to debug matching
  const tmVenueNames = new Set<string>()
  for (const e of tmEvents) {
    for (const v of (e._embedded?.venues ?? [])) {
      tmVenueNames.add(v.name)
    }
  }
  console.log('TM venue names found:', Array.from(tmVenueNames).sort().join(', '))

  // Get all venues with TM IDs
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, ticketmaster_venue_id')

  const venueIdMap = new Map<string, string>()   // TM venue ID → our venue UUID
  const venueNameMap = new Map<string, string>()  // lowercased name → our venue UUID
  for (const v of (venues ?? [])) {
    if (v.ticketmaster_venue_id) venueIdMap.set(v.ticketmaster_venue_id, v.id)
    venueNameMap.set(v.name.toLowerCase(), v.id)
  }

  // Also update TM venue IDs we discover during sync
  const venueIdUpdates = new Map<string, string>() // our venue UUID → TM venue ID

  for (const tmEvent of tmEvents) {
    try {
      const tmVenues = tmEvent._embedded?.venues ?? []

      // 1. Try matching by TM venue ID
      let matchedVenueId = tmVenues
        .map((v: { id: string; name: string }) => venueIdMap.get(v.id))
        .find((id: string | undefined) => id !== undefined)

      // 2. Fallback: match by venue name (fuzzy)
      if (!matchedVenueId) {
        for (const tmVenue of tmVenues) {
          const tmName = tmVenue.name?.toLowerCase() ?? ''
          // Try exact match first
          matchedVenueId = venueNameMap.get(tmName)
          if (!matchedVenueId) {
            // Try partial match
            for (const entry of Array.from(venueNameMap.entries())) {
              const [key, id] = entry
              if (tmName.includes(key) || key.includes(tmName)) {
                matchedVenueId = id
                // Save this TM venue ID so we can update it in the DB
                if (!venueIdMap.has(tmVenue.id)) {
                  venueIdUpdates.set(id, tmVenue.id)
                }
                break
              }
            }
          }
          if (matchedVenueId) break
        }
      }

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

  // Save any newly discovered TM venue IDs back to the DB
  for (const entry of Array.from(venueIdUpdates.entries())) {
    const [ourVenueId, tmVenueId] = entry
    await supabase
      .from('venues')
      .update({ ticketmaster_venue_id: tmVenueId })
      .eq('id', ourVenueId)
      .is('ticketmaster_venue_id', null)
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
