/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SERENO Color Palette - Sobrio y Pintoresco
        primary: {
          50: '#F0F2FF',
          100: '#E0E4FF',
          200: '#C7CDFF',
          300: '#A5AFFF',
          400: '#8389FF',
          500: '#6B73FF', // Main primary color - Azul sereno
          600: '#5A61E6',
          700: '#4A50CC',
          800: '#3D42B3',
          900: '#323799',
        },
        secondary: {
          50: '#F4FBE8',
          100: '#E8F5D0',
          200: '#D1EBA1',
          300: '#B9E072',
          400: '#A2D543',
          500: '#9BCF53', // Verde natural
          600: '#7CB042',
          700: '#5D9031',
          800: '#3E7020',
          900: '#1F500F',
        },
        accent: {
          50: '#FFF8F0',
          100: '#FFF1E0',
          200: '#FFE3C1',
          300: '#FFD5A2',
          400: '#FFC783',
          500: '#FFB347', // Naranja suave
          600: '#FF9F1A',
          700: '#E6890F',
          800: '#CC7A0D',
          900: '#B36B0B',
        },
        emergency: {
          50: '#FFF5F5',
          100: '#FFEBEB',
          200: '#FFD6D6',
          300: '#FFC2C2',
          400: '#FFADAD',
          500: '#FF6B6B', // Rojo coral
          600: '#FF5252',
          700: '#FF3838',
          800: '#FF1F1F',
          900: '#E60505',
        },
        // Neutral colors for senior-friendly interface
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Senior-friendly font sizes
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
        '5xl': ['48px', '1'],
        '6xl': ['60px', '1'],
      },
      spacing: {
        // Additional spacing for senior-friendly interfaces
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'gentle-bounce': 'gentle-bounce 1s ease-in-out infinite',
        'breathing': 'breathing 4s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'gentle-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'breathing': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'gradient-sereno': 'linear-gradient(135deg, #F7F9FC 0%, #E8F4FD 100%)',
        'gradient-calm': 'linear-gradient(135deg, #6B73FF 0%, #9BCF53 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #FFB347 0%, #FF6B6B 100%)',
        'sky-gradient': 'linear-gradient(135deg, #F7F9FC 0%, #E8F4FD 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}