/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
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
        sans: ['Inter', 'Plus Jakarta Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        cardHover: '0 12px 24px -8px rgba(4,170,109,0.25)',
        // Đổ bóng mềm nhiều lớp dùng cho khối nổi (elevation)
        soft: '0 2px 4px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.12)',
        softLg:
          '0 4px 8px rgba(15,23,42,0.05), 0 24px 48px -12px rgba(15,23,42,0.25)',
        // Hào quang phát sáng theo từng ngôn ngữ
        glowPython: '0 18px 40px -12px rgba(56,189,248,0.55)',
        glowSql: '0 18px 40px -12px rgba(251,146,60,0.55)',
        glowC: '0 18px 40px -12px rgba(96,165,250,0.55)',
        glowCpp: '0 18px 40px -12px rgba(139,92,246,0.55)',
        glowBrand: '0 18px 40px -12px rgba(4,170,109,0.55)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)',
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
        // Mesh gradient dịch chuyển nhẹ tạo cảm giác "sống"
        'mesh-shift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(3%, -4%) scale(1.08)' },
          '66%': { transform: 'translate(-3%, 3%) scale(0.96)' },
        },
        // Vòng sóng cho hiệu ứng pulse của nút AI
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.6' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        // Con trỏ gõ chữ trong code mock-up
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        // Gradient chạy ngang cho nền/chữ
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
        float: 'float 4s ease-in-out infinite',
        'mesh-shift': 'mesh-shift 18s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        blink: 'blink 1.1s step-end infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
      },
    },
  },
  plugins: [],
};
