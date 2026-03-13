import EventCard from './EventCard'
import { formatEventDateLong } from '@/lib/utils/dates'
import { groupEventsByDate } from '@/lib/utils/dates'
import type { EventWithVenue } from '@/types'
import Link from 'next/link'

interface EventListProps {
  events: EventWithVenue[]
  totalCount: number
  currentPage: number
  pageSize: number
  searchParams: Record<string, string>
}

export default function EventList({
  events,
  totalCount,
  currentPage,
  pageSize,
  searchParams,
}: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">🎵</div>
        <h3 className="text-xl font-semibold text-white mb-2">No shows found</h3>
        <p className="text-white/50 max-w-md">
          No shows found matching your filters. Try broadening your search or clearing filters.
        </p>
      </div>
    )
  }

  const grouped = groupEventsByDate(events)
  const totalPages = Math.ceil(totalCount / pageSize)

  function buildPageUrl(page: number) {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    return `/events?${params.toString()}`
  }

  return (
    <div>
      {/* Event groups */}
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([date, dateEvents]) => (
          <section key={date}>
            <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-4 flex items-center gap-3">
              <span>{formatEventDateLong(date)}</span>
              <span className="h-px flex-1 bg-brand-500/20" />
              <span className="text-white/30">{dateEvents.length} show{dateEvents.length !== 1 ? 's' : ''}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dateEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          {currentPage > 1 && (
            <Link
              href={buildPageUrl(currentPage - 1)}
              className="px-4 py-2 rounded-lg bg-surface-800 text-white/70 hover:text-white hover:bg-surface-700 text-sm transition-colors"
            >
              ← Previous
            </Link>
          )}

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page: number
              if (totalPages <= 7) {
                page = i + 1
              } else if (currentPage <= 4) {
                page = i + 1
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + i
              } else {
                page = currentPage - 3 + i
              }

              return (
                <Link
                  key={page}
                  href={buildPageUrl(page)}
                  className={`
                    w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                    ${page === currentPage
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-800 text-white/60 hover:text-white hover:bg-surface-700'
                    }
                  `}
                >
                  {page}
                </Link>
              )
            })}
          </div>

          {currentPage < totalPages && (
            <Link
              href={buildPageUrl(currentPage + 1)}
              className="px-4 py-2 rounded-lg bg-surface-800 text-white/70 hover:text-white hover:bg-surface-700 text-sm transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}

      {/* Page info */}
      <p className="text-center text-white/30 text-sm mt-4">
        Page {currentPage} of {totalPages} &mdash; {totalCount} total events
      </p>
    </div>
  )
}
