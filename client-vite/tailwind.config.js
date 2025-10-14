/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],

  extend: {
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0', transform: 'translateY(20px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
  },
  animation: {
    fadeIn: 'fadeIn 0.8s ease forwards',
    fadeInDelay: 'fadeIn 0.8s ease 0.2s forwards',
    fadeInDelay2: 'fadeIn 0.8s ease 0.4s forwards',
  },
}

}
