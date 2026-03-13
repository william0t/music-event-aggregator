export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Venue {
  id: string
  name: string
  slug: string
  address: string | null
  neighborhood: string | null
  city: string
  state: string
  capacity: number | null
  website_url: string | null
  image_url: string | null
  ticketmaster_venue_id: string | null
  scrape_url: string | null
  scrape_strategy: 'ticketmaster' | 'bandsintown' | 'custom' | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  artist_name: string
  supporting_acts: string[] | null
  venue_id: string
  event_date: string       // ISO date string YYYY-MM-DD
  doors_time: string | null
  start_time: string | null
  ticket_url: string | null
  price_min: number | null
  price_max: number | null
  image_url: string | null
  description: string | null
  genre: string | null
  source: 'ticketmaster' | 'bandsintown' | 'scraped'
  external_id: string
  is_cancelled: boolean
  is_sold_out: boolean
  created_at: string
  updated_at: string
}

export interface EventWithVenue extends Event {
  venues: Venue
}

export interface UserPreferences {
  id: string
  user_id: string
  followed_venue_ids: string[]
  followed_artists: string[]
  newsletter_enabled: boolean
  newsletter_day: string
  newsletter_time: string
  created_at: string
  updated_at: string
}

// Filter state for the events page
export interface EventFilters {
  venueIds: string[]
  artistSearch: string
  dateFrom: string | null
  dateTo: string | null
  neighborhood: string | null
}

// Ticketmaster API response shapes (partial)
export interface TMEvent {
  id: string
  name: string
  dates: {
    start: { localDate: string; localTime?: string }
    status: { code: string }
  }
  priceRanges?: Array<{ min: number; max: number; currency: string }>
  images: Array<{ url: string; width: number; height: number; ratio: string }>
  url: string
  info?: string
  _embedded?: {
    venues: Array<{
      id: string
      name: string
    }>
    attractions?: Array<{ name: string; classifications?: Array<{ genre?: { name: string } }> }>
  }
}

export interface TMResponse {
  _embedded?: { events: TMEvent[] }
  page: { totalElements: number; totalPages: number; number: number; size: number }
}

// Bandsintown API response shapes
export interface BITEvent {
  id: string
  title: string
  datetime: string
  venue: {
    name: string
    city: string
    region: string
    country: string
  }
  offers: Array<{ type: string; url: string; status: string }>
  lineup: string[]
  description: string
  artist: { name: string; image_url: string; thumb_url: string }
  artist_id: string
}

export interface SyncResult {
  source: string
  eventsUpserted: number
  eventsSkipped: number
  errors: string[]
}
