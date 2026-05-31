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
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)',
        // Lưới chấm tinh tế (dot grid) cho nền cao cấp
        'dot-grid':
          'radial-gradient(rgba(148,163,184,0.18) 1px, transparent 1px)',
        // Vầng sáng aurora nhiều màu
        aurora:
          'conic-gradient(from 180deg at 50% 50%, #04aa6d 0deg, #38bdf8 90deg, #8b5cf6 180deg, #f59e0b 270deg, #04aa6d 360deg)',
        shimmer:
          'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
      },
      transitionTimingFunction: {
        // Easing mềm, có chút "spring" như sản phẩm cao cấp
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        cardHover: '0 12px 24px -8px rgba(4,170,109,0.25)',
        // Đổ bóng mềm nhiều lớp dùng cho khối nổi (elevation)
        soft: '0 2px 4px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.12)',
        softLg:
          '0 4px 8px rgba(15,23,42,0.05), 0 24px 48px -12px rgba(15,23,42,0.25)',
        // Bóng "nâng" rất sâu cho hero/CTA
        floaty:
          '0 8px 16px rgba(15,23,42,0.06), 0 32px 64px -24px rgba(15,23,42,0.35)',
        // Viền sáng bên trong (inset) cho hiệu ứng kính
        glass:
          'inset 0 1px 0 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.06)',
        // Hào quang phát sáng theo từng ngôn ngữ
        glowPython: '0 18px 40px -12px rgba(56,189,248,0.55)',
        glowSql: '0 18px 40px -12px rgba(251,146,60,0.55)',
        glowC: '0 18px 40px -12px rgba(96,165,250,0.55)',
        glowCpp: '0 18px 40px -12px rgba(139,92,246,0.55)',
        glowBrand: '0 18px 40px -12px rgba(4,170,109,0.55)',
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
        // Aurora xoay chậm phía sau hero
        'aurora-spin': {
          '0%': { transform: 'rotate(0deg) scale(1.4)' },
          '100%': { transform: 'rotate(360deg) scale(1.4)' },
        },
        // Quét sáng ngang (shimmer) cho badge/skeleton
        shimmer: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
        // Băng chạy vô tận (marquee) cho dải logo/tag
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // Nhịp đập nhẹ cho điểm nhấn
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
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
        'aurora-spin': 'aurora-spin 22s linear infinite',
        shimmer: 'shimmer 2.4s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
        'pulse-soft': 'pulse-soft 2.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
