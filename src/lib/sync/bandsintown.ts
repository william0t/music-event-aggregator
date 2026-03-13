import type { BITEvent } from '@/types'

const BIT_BASE = 'https://rest.bandsintown.com'

const DENVER_METRO_CITIES = [
  'Denver', 'Aurora', 'Englewood', 'Morrison', 'Lakewood',
  'Westminster', 'Arvada', 'Thornton', 'Centennial', 'Highlands Ranch',
]

function isDenverMetro(city?: string): boolean {
  if (!city) return false
  return DENVER_METRO_CITIES.some(c => city.toLowerCase().includes(c.toLowerCase()))
}

// ─── VENUE-BASED FETCHING (primary strategy) ──────────────────────────────────

// Search Bandsintown for a venue by name and city, returns their internal venue ID
export async function searchBandsintownVenue(
  venueName: string,
  city = 'Denver'
): Promise<string | null> {
  const appId = process.env.BANDSINTOWN_APP_ID
  if (!appId) throw new Error('BANDSINTOWN_APP_ID not set')

  const params = new URLSearchParams({ query: venueName, app_id: appId })
  const res = await fetch(`${BIT_BASE}/venues?${params}`)
  if (!res.ok) return null

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null

  // Find the best match: same city, name contains our venue name (case-insensitive)
  const nameLower = venueName.toLowerCase()
  const match = data.find((v: { name?: string; city?: string; id?: string }) => {
    const vName = v.name?.toLowerCase() ?? ''
    const vCity = v.city?.toLowerCase() ?? ''
    const cityMatch = isDenverMetro(v.city)
    const nameMatch = vName.includes(nameLower) || nameLower.includes(vName)
    return cityMatch && nameMatch
  })

  return match?.id ? String(match.id) : null
}

// Fetch upcoming events at a specific Bandsintown venue ID
export async function fetchBandsintownVenueEvents(
  bandsintownVenueId: string
): Promise<BITEvent[]> {
  const appId = process.env.BANDSINTOWN_APP_ID
  if (!appId) throw new Error('BANDSINTOWN_APP_ID not set')

  const params = new URLSearchParams({ app_id: appId, date: 'upcoming' })
  const res = await fetch(`${BIT_BASE}/venues/${bandsintownVenueId}/events?${params}`)
  if (!res.ok) return []

  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// ─── ARTIST-BASED FETCHING (fallback strategy) ────────────────────────────────

// Fetch upcoming events for a specific artist name, filtered to Denver metro
export async function fetchBandsintownArtistEvents(artistName: string): Promise<BITEvent[]> {
  const appId = process.env.BANDSINTOWN_APP_ID
  if (!appId) throw new Error('BANDSINTOWN_APP_ID not set')

  const encodedName = encodeURIComponent(artistName)
  const res = await fetch(
    `${BIT_BASE}/artists/${encodedName}/events?app_id=${appId}&date=upcoming`
  )

  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []

  return data.filter((event: BITEvent) => isDenverMetro(event.venue?.city))
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── BATCH HELPERS ────────────────────────────────────────────────────────────

export interface VenueWithMeta {
  id: string
  name: string
  slug: string
  scrape_url: string | null
}

// For each venue: look up BIT venue ID (using cached scrape_url if available),
// then fetch events. Returns events tagged with our internal venue UUID.
export async function fetchAllBandsintownVenueEvents(
  venues: VenueWithMeta[]
): Promise<{ event: BITEvent; ourVenueId: string; bitVenueId: string }[]> {
  const results: { event: BITEvent; ourVenueId: string; bitVenueId: string }[] = []

  for (const venue of venues) {
    try {
      // Use cached BIT venue ID if we already have it stored in scrape_url
      let bitVenueId: string | null = venue.scrape_url ?? null

      if (!bitVenueId) {
        bitVenueId = await searchBandsintownVenue(venue.name)
        await sleep(200) // be polite after a search call
      }

      if (!bitVenueId) {
        console.log(`BIT: no venue ID found for "${venue.name}", skipping`)
        continue
      }

      const events = await fetchBandsintownVenueEvents(bitVenueId)
      console.log(`BIT: ${events.length} events at "${venue.name}" (ID: ${bitVenueId})`)

      for (const event of events) {
        results.push({ event, ourVenueId: venue.id, bitVenueId })
      }

      await sleep(150)
    } catch (err) {
      console.error(`BIT error for venue "${venue.name}":`, err)
    }
  }

  return results
}
