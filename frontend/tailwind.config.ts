/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ara: {
          bg: '#0b0a14',
          surface: 'rgba(255, 255, 255, 0.03)',
          'surface-hover': 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(240, 185, 91, 0.1)',
          accent: '#f0b95b',
          'accent-dim': 'rgba(240, 185, 91, 0.15)',
          text: '#e8e3d8',
          'text-dim': 'rgba(232, 227, 216, 0.5)',
          'text-muted': 'rgba(232, 227, 216, 0.35)',
          user: 'rgba(240, 185, 91, 0.08)',
          'user-border': 'rgba(240, 185, 91, 0.2)',
          error: '#e74c3c',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        body: ['Newsreader', 'serif'],
        mono: ['Spline Sans Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-gentle': 'pulseGentle 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse-scale': 'pulseScale 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseScale: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
        },
      },
    },
  },
  plugins: [],
}
