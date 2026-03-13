import VenueCard from './VenueCard'
import type { Venue } from '@/types'

interface VenueWithCount extends Venue {
  upcomingCount: number
}

interface VenueGridProps {
  venues: VenueWithCount[]
}

export default function VenueGrid({ venues }: VenueGridProps) {
  if (venues.length === 0) {
    return (
      <div className="text-center py-12 text-white/50">
        No venues found.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {venues.map(venue => (
        <VenueCard
          key={venue.id}
          venue={venue}
          upcomingCount={venue.upcomingCount}
        />
      ))}
    </div>
  )
}
