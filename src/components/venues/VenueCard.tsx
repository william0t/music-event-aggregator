import Link from 'next/link'
import { MapPin, Users, Calendar } from 'lucide-react'
import type { Venue } from '@/types'

interface VenueCardProps {
  venue: Venue
  upcomingCount?: number
}

// Generate a deterministic gradient color based on venue name
function getVenueGradient(name: string): string {
  const gradients = [
    'from-purple-900/50 to-surface-900',
    'from-blue-900/50 to-surface-900',
    'from-green-900/50 to-surface-900',
    'from-orange-900/50 to-surface-900',
    'from-red-900/50 to-surface-900',
    'from-pink-900/50 to-surface-900',
    'from-teal-900/50 to-surface-900',
    'from-indigo-900/50 to-surface-900',
  ]
  const index = name.charCodeAt(0) % gradients.length
  return gradients[index]
}

export default function VenueCard({ venue, upcomingCount = 0 }: VenueCardProps) {
  const gradient = getVenueGradient(venue.name)

  return (
    <Link href={`/venues/${venue.slug}`} className="block group">
      <article className="bg-surface-800 rounded-xl overflow-hidden hover:ring-1 hover:ring-brand-500/30 transition-all duration-200">
        {/* Image / gradient header */}
        <div className={`relative h-32 bg-gradient-to-br ${gradient}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-black text-white/10 select-none">
              {venue.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {upcomingCount > 0 && (
            <div className="absolute top-3 right-3 bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {upcomingCount} upcoming
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="text-white font-bold text-base leading-tight group-hover:text-brand-500 transition-colors line-clamp-1">
            {venue.name}
          </h3>

          <div className="flex items-center gap-1.5 text-white/50 text-sm">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{venue.neighborhood ?? venue.city}</span>
          </div>

          {venue.capacity && (
            <div className="flex items-center gap-1.5 text-white/40 text-sm">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Cap. {venue.capacity.toLocaleString()}</span>
            </div>
          )}

          {upcomingCount === 0 && (
            <div className="flex items-center gap-1.5 text-white/30 text-sm">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>No upcoming shows</span>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
