import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f6f3eb',
        surface: {
          DEFAULT: '#ffffff',
          soft: '#fbf8f2',
          strong: '#efe7d8',
        },
        primary: {
          DEFAULT: '#2f6f4f',
          dark: '#215139',
          soft: '#dceade',
        },
        accent: {
          DEFAULT: '#d98a3d',
          soft: '#f7e4cf',
        },
        cta: '#e26d2f',
        ink: '#243129',
        text: '#2f3a34',
        muted: '#6d776f',
        border: '#ddd4c4',
      },
      fontFamily: {
        heading: ['var(--font-nunito)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        sm: '10px',
        md: '18px',
        lg: '28px',
        xl: '36px',
      },
      boxShadow: {
        card: '0 10px 30px rgba(36, 49, 41, 0.08)',
        sm: '0 4px 12px rgba(36, 49, 41, 0.06)',
      },
    },
  },
  plugins: [],
}

export default config
