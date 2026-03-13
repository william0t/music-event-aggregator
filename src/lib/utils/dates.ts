import { format, parseISO, isToday, isTomorrow } from 'date-fns'

export function formatEventDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE MMM d')
}

export function formatEventDateLong(dateStr: string): string {
  const date = parseISO(dateStr)
  return format(date, 'EEEE, MMMM d')
}

export function formatTime(timeStr: string | null): string | null {
  if (!timeStr) return null
  const [hours, minutes] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'pm' : 'am'
  const displayHour = hours % 12 || 12
  return `${displayHour}${minutes > 0 ? `:${String(minutes).padStart(2, '0')}` : ''}${period}`
}

export function formatPrice(min: number | null, max: number | null): string {
  if (!min && !max) return 'TBA'
  if (min === 0) return 'Free'
  if (min && max && min !== max) return `$${min}–$${max}`
  if (min) return `$${min}`
  return 'TBA'
}

export function todayISODate(): string {
  return new Date().toISOString().split('T')[0]
}

export function groupEventsByDate<T extends { event_date: string }>(
  events: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const event of events) {
    const key = event.event_date
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(event)
  }
  return grouped
}
