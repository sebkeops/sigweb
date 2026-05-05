type BadgeVariant =
  | 'green'
  | 'orange'
  | 'gray'
  | 'red'
  | 'blue'
  | 'purple'
  | 'yellow'
  | 'indigo'
  | 'dark'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  green: 'bg-primary-soft text-primary-dark',
  orange: 'bg-accent-soft text-accent',
  gray: 'bg-surface-strong text-muted',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  indigo: 'bg-indigo-100 text-indigo-700',
  dark: 'bg-ink/10 text-ink',
}

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-body text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
