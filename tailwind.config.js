/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)',
        'gradient-card':    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-success': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        'gradient-warn':    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-info':    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-purple':  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'gradient-dark':    'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      },
      boxShadow: {
        'glow-brand':  '0 0 20px rgba(79,70,229,0.35), 0 4px 12px rgba(79,70,229,0.2)',
        'glow-cyan':   '0 0 20px rgba(6,182,212,0.35)',
        'glow-violet': '0 0 20px rgba(124,58,237,0.35)',
        'card-lift':   '0 8px 32px rgba(0,0,0,0.12)',
        'card-hover':  '0 16px 48px rgba(0,0,0,0.16)',
      },
      animation: {
        'fade-up':       'fadeUp 0.4s ease-out forwards',
        'fade-in':       'fadeIn 0.3s ease-out forwards',
        'scale-in':      'scaleIn 0.3s ease-out forwards',
        'slide-right':   'slideRight 0.35s ease-out forwards',
        'pulse-glow':    'pulseGlow 2s ease-in-out infinite',
        'float':         'float 3s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'gradient-shift':'gradientShift 4s ease infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(79,70,229,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(79,70,229,0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
}
