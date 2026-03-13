import type { TMResponse, TMEvent } from '@/types'

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2'
const DENVER_LAT = 39.7392
const DENVER_LNG = -104.9903
const RADIUS_MILES = 30

export async function fetchTicketmasterEvents(): Promise<TMEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) throw new Error('TICKETMASTER_API_KEY not set')

  const allEvents: TMEvent[] = []
  let page = 0
  let totalPages = 1

  while (page < totalPages && page < 5) { // max 5 pages = 1000 events
    const params = new URLSearchParams({
      apikey: apiKey,
      classificationName: 'music',
      latlong: `${DENVER_LAT},${DENVER_LNG}`,
      radius: String(RADIUS_MILES),
      unit: 'miles',
      size: '200',
      page: String(page),
      sort: 'date,asc',
      // Only fetch events from today forward
      startDateTime: new Date().toISOString().split('.')[0] + 'Z',
    })

    const res = await fetch(`${TM_BASE}/events.json?${params}`)
    if (!res.ok) {
      console.error(`TM API error: ${res.status} ${res.statusText}`)
      break
    }

    const data: TMResponse = await res.json()
    const events = data._embedded?.events ?? []
    allEvents.push(...events)

    totalPages = data.page.totalPages
    page++

    // Rate limit: TM allows 5 req/sec, be safe
    if (page < totalPages) await sleep(250)
  }

  return allEvents
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
