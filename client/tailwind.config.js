/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Xanh lá chủ đạo lấy cảm hứng W3Schools
        brand: {
          50: '#eafaf1',
          100: '#d2f4e0',
          200: '#a7e9c4',
          300: '#6fd9a0',
          400: '#34c77b',
          500: '#04aa6d',
          600: '#048a59',
          700: '#046c47',
          800: '#04543a',
          900: '#063b2a',
        },
        // Màu nền tối cho header/sidebar (giống thanh điều hướng W3Schools)
        ink: {
          800: '#2b2d3a',
          900: '#1f2128',
        },
        accent: {
          500: '#ffb400', // vàng cho nút "Try it"/nhấn mạnh
          600: '#e6a200',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        cardHover: '0 12px 24px -8px rgba(4,170,109,0.25)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
