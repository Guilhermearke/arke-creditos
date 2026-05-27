import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'arke-dark': '#0A0E1A',
        'arke-accent': '#2563EB',
      },
    },
  },
  plugins: [],
}

export default config
