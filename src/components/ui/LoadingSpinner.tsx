interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`
        ${sizeClasses[size]} rounded-full border-white/20 border-t-brand-500
        animate-spin ${className}
      `}
      aria-label="Loading"
      role="status"
    />
  )
}

export function EventCardSkeleton() {
  return (
    <div className="bg-surface-800 rounded-xl overflow-hidden animate-pulse">
      <div className="h-40 bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-white/10 rounded w-3/4" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 bg-white/10 rounded-full w-16" />
          <div className="h-6 bg-white/10 rounded-full w-20" />
        </div>
        <div className="h-9 bg-white/10 rounded-lg mt-2" />
      </div>
    </div>
  )
}
