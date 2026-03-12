import Link from 'next/link'

type Variant = 'primary' | 'secondary' | 'cta' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

interface LinkButtonProps {
  href: string
  variant?: Variant
  size?: Size
  children: React.ReactNode
  className?: string
}

const base =
  'inline-flex items-center justify-center font-heading font-bold transition-opacity rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:opacity-90',
  secondary: 'bg-primary-soft text-primary-dark hover:bg-primary-soft/80',
  cta: 'bg-cta text-white hover:opacity-90',
  ghost: 'border border-border bg-transparent text-text hover:bg-surface-strong',
  danger: 'bg-red-600 text-white hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Chargement…' : children}
    </button>
  )
}

export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  )
}
