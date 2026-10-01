import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        heading: [
          'var(--font-heading)',
          'Plus Jakarta Sans',
          'Inter',
          'Noto Sans Devanagari',
          'Noto Sans Bengali',
          'Noto Sans Tamil',
          'system-ui',
          'sans-serif',
        ],
        sans: [
          'var(--font-sans)',
          'Inter',
          'Noto Sans Devanagari',
          'Noto Sans Bengali',
          'Noto Sans Tamil',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        primary: {
          DEFAULT: 'var(--primary)',
          soft: 'var(--primary-soft)',
        },
        blue: 'var(--blue)',
        red: 'var(--red)',
        yellow: 'var(--yellow)',
        green: 'var(--green)',
        critical: {
          DEFAULT: 'var(--critical)',
          soft: 'var(--critical-soft)',
        },
        high: 'var(--high)',
        medium: 'var(--medium)',
        low: 'var(--low)',
      },
      borderRadius: {
        card: '16px',
        panel: '16px',
        control: '8px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(60, 64, 67, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
