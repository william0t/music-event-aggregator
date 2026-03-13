import type { Event } from '@/types'

/**
 * Checks for potential duplicate events based on artist name, venue, and date.
 * The DB-level UNIQUE(external_id, source) constraint handles exact deduplication.
 * This module handles fuzzy/cross-source deduplication if needed in the future.
 */
export function deduplicateEvents(events: Partial<Event>[]): Partial<Event>[] {
  const seen = new Set<string>()
  return events.filter(event => {
    const key = `${event.artist_name?.toLowerCase()}|${event.venue_id}|${event.event_date}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
