type BadgeVariant = 'green' | 'orange' | 'gray' | 'red'

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
