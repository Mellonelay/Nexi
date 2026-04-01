import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dexi: {
          dark: '#0a0e27',
          darker: '#060918',
          blue: '#00d4ff',
          purple: '#6366f1',
          cyan: '#22d3ee',
          pink: '#ec4899',
          green: '#10b981',
          red: '#ef4444',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-dexi': 'linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)',
        'gradient-dexi-text': 'linear-gradient(90deg, #00d4ff 0%, #6366f1 50%, #ec4899 100%)',
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(99, 102, 241, 0.5)',
        'neon-cyan': '0 0 20px rgba(34, 211, 238, 0.5)',
      },
    },
  },
  plugins: [],
}
export default config
