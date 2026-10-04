/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#0B1020',
          surface: '#111827',
          elevated: '#1B2536',
          border: '#1F293D',
        },
        brand: {
          primary: '#6366F1',
          'primary-hover': '#4F46E5',
          secondary: '#22C55E',
          accent: '#38BDF8',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        git: {
          working: '#F59E0B',   // Warm amber for working directory
          staged: '#22C55E',    // Green for staged
          local: '#6366F1',     // Indigo for local commits
          remote: '#38BDF8',    // Sky blue for GitHub remote
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(99, 102, 241, 0.3)',
        'glow-accent': '0 0 25px -5px rgba(56, 189, 248, 0.3)',
        'glow-green': '0 0 25px -5px rgba(34, 197, 94, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}
