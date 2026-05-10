/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#060609',
        surface: '#0d0d12',
        border: '#1a1a24',
        ink: '#e6e3db',
        muted: '#6a6a7a',
        accent: '#b8ff47',
        'accent-dim': '#1a2600',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Syne', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      typography: {
        invert: {
          css: {
            '--tw-prose-body': '#e6e3db',
            '--tw-prose-headings': '#e6e3db',
            '--tw-prose-links': '#b8ff47',
            '--tw-prose-bold': '#e6e3db',
            '--tw-prose-counters': '#6a6a7a',
            '--tw-prose-bullets': '#b8ff47',
            '--tw-prose-hr': '#1a1a24',
            '--tw-prose-quotes': '#e6e3db',
            '--tw-prose-code': '#b8ff47',
            '--tw-prose-pre-bg': '#0d0d12',
          },
        },
      },
    },
  },
  plugins: [],
};
