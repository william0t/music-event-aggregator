import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'orange' | 'green' | 'red' | 'gray' | 'blue'
}

const variantClasses = {
  default: 'bg-white/10 text-white/70',
  orange: 'bg-brand-500/20 text-brand-500 border border-brand-500/30',
  green: 'bg-green-500/20 text-green-400 border border-green-500/30',
  red: 'bg-red-500/20 text-red-400 border border-red-500/30',
  gray: 'bg-white/5 text-white/50',
  blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
}

export default function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
        ${variantClasses[variant]} ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}
