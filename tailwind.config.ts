import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primaire: '#14532d',
        accent: '#f97316'
      }
    }
  },
  plugins: []
} satisfies Config;
