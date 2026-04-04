import type { Config } from 'tailwindcss'

function withOpacity(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`
}

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: withOpacity('--bg-primary'),
          secondary: withOpacity('--bg-secondary'),
          tint: withOpacity('--bg-tint'),
        },
        text: {
          primary: withOpacity('--text-primary'),
          secondary: withOpacity('--text-secondary'),
        },
        accent: {
          DEFAULT: withOpacity('--accent'),
          light: withOpacity('--accent-light'),
          dark: withOpacity('--accent-dark'),
        },
        border: withOpacity('--border-color'),
      },
      boxShadow: {
        card: 'var(--shadow)',
        'card-lg': 'var(--shadow-lg)',
      },
      borderColor: {
        DEFAULT: `rgb(var(--border-color))`,
      },
      borderRadius: {
        xl: 'var(--radius)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
