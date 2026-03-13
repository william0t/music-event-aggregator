import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, MapPin, Clock, Tag } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatEventDate, formatTime, formatPrice } from '@/lib/utils/dates'
import type { EventWithVenue } from '@/types'

interface EventCardProps {
  event: EventWithVenue
}

export default function EventCard({ event }: EventCardProps) {
  const venue = event.venues
  const dateStr = formatEventDate(event.event_date)
  const timeStr = formatTime(event.start_time)
  const doorsStr = formatTime(event.doors_time)
  const priceStr = formatPrice(event.price_min, event.price_max)

  const timeDisplay = doorsStr
    ? `Doors ${doorsStr}`
    : timeStr
    ? `Starts ${timeStr}`
    : null

  return (
    <article className="bg-surface-800 rounded-xl overflow-hidden flex flex-col hover:ring-1 hover:ring-brand-500/30 transition-all duration-200 group">
      {/* Image header */}
      <div className="relative h-40 bg-gradient-to-br from-surface-900 to-surface-800 overflow-hidden">
        {event.image_url && (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover opacity-80 group-hover:opacity-90 transition-opacity"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-800/80 to-transparent" />

        {/* Status badges overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {event.is_cancelled && <Badge variant="red">Cancelled</Badge>}
          {event.is_sold_out && !event.is_cancelled && <Badge variant="gray">Sold Out</Badge>}
          {event.genre && <Badge variant="blue">{event.genre}</Badge>}
        </div>

        {/* Date badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            {dateStr}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Artist info */}
        <div>
          <h3 className="text-white font-bold text-lg leading-tight line-clamp-1">
            {event.artist_name}
          </h3>
          {event.supporting_acts && event.supporting_acts.length > 0 && (
            <p className="text-white/50 text-sm mt-0.5 line-clamp-1">
              with {event.supporting_acts.slice(0, 2).join(', ')}
              {event.supporting_acts.length > 2 && ` +${event.supporting_acts.length - 2} more`}
            </p>
          )}
        </div>

        {/* Venue */}
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <Link
              href={`/venues/${venue.slug}`}
              className="text-white/80 hover:text-brand-500 text-sm font-medium transition-colors line-clamp-1"
            >
              {venue.name}
            </Link>
            {venue.neighborhood && (
              <p className="text-white/40 text-xs">{venue.neighborhood}</p>
            )}
          </div>
        </div>

        {/* Time + price row */}
        <div className="flex items-center justify-between text-sm">
          {timeDisplay && (
            <div className="flex items-center gap-1.5 text-white/60">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{timeDisplay}</span>
            </div>
          )}
          <span className={`font-semibold ml-auto ${priceStr === 'TBA' ? 'text-white/40' : 'text-white'}`}>
            {priceStr}
          </span>
        </div>

        {/* Footer: source + ticket button */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-white/30 text-xs flex items-center gap-1">
            <Tag className="w-3 h-3" />
            via {event.source === 'ticketmaster' ? 'Ticketmaster' : 'Bandsintown'}
          </span>

          {event.ticket_url && !event.is_cancelled && (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto"
            >
              <Button size="sm" variant={event.is_sold_out ? 'secondary' : 'primary'}>
                {event.is_sold_out ? 'Sold Out' : 'Get Tickets'}
                <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
