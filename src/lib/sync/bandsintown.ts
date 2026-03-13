import type { BITEvent } from '@/types'

const BIT_BASE = 'https://rest.bandsintown.com'

const DENVER_METRO_CITIES = [
  'Denver', 'Aurora', 'Englewood', 'Morrison', 'Lakewood',
  'Westminster', 'Arvada', 'Thornton', 'Centennial', 'Highlands Ranch',
]

// Fetch all upcoming events for a specific artist name
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

  // Filter to Denver metro
  return data.filter((event: BITEvent) =>
    DENVER_METRO_CITIES.some(
      city => event.venue?.city?.toLowerCase().includes(city.toLowerCase())
    )
  )
}

// Fetch events for a list of artist names and filter to Denver
export async function fetchBandsintownEventsBatch(artistNames: string[]): Promise<BITEvent[]> {
  const allEvents: BITEvent[] = []

  for (const name of artistNames) {
    try {
      const events = await fetchBandsintownArtistEvents(name)
      allEvents.push(...events)
      await sleep(100) // be polite to the API
    } catch (err) {
      console.error(`BIT error for artist ${name}:`, err)
    }
  }

  return allEvents
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
