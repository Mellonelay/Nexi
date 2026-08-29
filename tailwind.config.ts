import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        dexi: {
          void: 'var(--nexi-canvas)',
          background: 'var(--nexi-background)',
          surface: 'var(--nexi-surface)',
          elevated: 'var(--nexi-surface-raised)',
          active: 'var(--nexi-surface-high)',
          border: 'var(--nexi-border)',
          violet: 'var(--nexi-primary)',
          purple: 'var(--nexi-primary-secondary)',
          cyan: 'var(--nexi-cyan)',
          aqua: 'var(--nexi-aqua)',
          text: 'var(--nexi-text)',
          muted: 'var(--nexi-text-muted)',
          green: 'var(--nexi-positive)',
          red: 'var(--nexi-negative)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-dexi': 'linear-gradient(135deg, var(--nexi-primary) 0%, var(--nexi-ref-violet-deep) 100%)',
        'gradient-dexi-text': 'linear-gradient(90deg, var(--nexi-text) 0%, var(--nexi-focus) 100%)',
      },
      boxShadow: {
        'neon-blue': '0 0 22px var(--nexi-cyan-glow)',
        'neon-purple': '0 0 30px var(--nexi-violet-glow)',
        'neon-cyan': '0 0 22px var(--nexi-cyan-glow)',
        'nexi-panel': 'var(--nexi-shadow-panel)',
        'nexi-active': 'var(--nexi-shadow-active)',
      },
    },
  },
  plugins: [],
}
export default config
