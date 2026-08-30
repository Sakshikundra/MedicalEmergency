/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Landing page design tokens (from Magic Patterns export)
                paper: {
                    DEFAULT: '#f3f0ea',
                    deep: '#e9e5dc',
                    card: '#fbfaf7',
                },
                ink: {
                    DEFAULT: '#17191c',
                    700: '#3f444a',
                    500: '#6c7278',
                    300: '#a4a8ac',
                    line: 'rgba(23, 25, 28, 0.14)',
                },
                alert: '#b4342b',
                primary: {
                    50: '#e6f7ff',
                    100: '#bae7ff',
                    200: '#91d5ff',
                    300: '#69c0ff',
                    400: '#40a9ff',
                    500: '#1890ff',
                    600: '#096dd9',
                    700: '#0050b3',
                    800: '#003a8c',
                    900: '#002766',
                },
                medical: {
                    red: '#ff4d4f',
                    yellow: '#faad14',
                    green: '#52c41a',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Instrument Serif', 'Georgia', 'serif'],
                mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
            },
            boxShadow: {
                'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
                'card': '0 4px 12px rgba(0, 0, 0, 0.1)',
                'hover': '0 8px 24px rgba(0, 0, 0, 0.15)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in',
                'slide-up': 'slideUp 0.4s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
