interface LogoProps {
  size?: number
  /** Préfixe unique pour les IDs de gradient — évite les conflits quand le logo est répété */
  uid?: string
}

export default function Logo({ size = 32, uid = 'logo' }: LogoProps) {
  const g1 = `${uid}-g1`
  const g2 = `${uid}-g2`

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      width={size}
      height={size}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={g1} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d98a3d" />
          <stop offset="35%" stopColor="#c88a45" />
          <stop offset="70%" stopColor="#5c7c5f" />
          <stop offset="100%" stopColor="#2f6f4f" />
        </linearGradient>
        <linearGradient id={g2} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d98a3d" />
          <stop offset="100%" stopColor="#2f6f4f" />
        </linearGradient>
      </defs>

      {/* Halo */}
      <path
        d="M 100 100 C 88 80, 68 55, 48 50 C 28 45, 14 58, 14 75 C 14 92, 28 108, 52 113 C 74 118, 94 112, 100 100"
        stroke="#d98a3d"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
        opacity="0.05"
      />
      <path
        d="M 100 100 C 106 80, 126 55, 152 50 C 172 45, 186 58, 186 75 C 186 92, 172 108, 148 113 C 126 118, 106 112, 100 100"
        stroke="#2f6f4f"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
        opacity="0.05"
      />

      {/* Tracé principal */}
      <path
        d="M 100 100 C 88 80, 68 55, 48 50 C 28 45, 14 58, 14 75 C 14 92, 28 108, 52 113 C 74 118, 94 112, 100 100"
        stroke={`url(#${g1})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <path
        d="M 100 100 C 106 80, 126 55, 152 50 C 172 45, 186 58, 186 75 C 186 92, 172 108, 148 113 C 126 118, 106 112, 100 100"
        stroke={`url(#${g2})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
