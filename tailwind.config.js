/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#10B981',
        'dark-green': '#059669',
        'light-green': '#ecfdf5',
        'accent-blue': '#3B82F6',
        'warning-amber': '#F59E0B',
        'error-red': '#EF4444',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
      },
    },
  },
  plugins: [],
}