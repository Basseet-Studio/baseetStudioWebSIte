/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./hugo_stats.json",
    "./content/**/*.{html,md}",
    "./layouts/**/*.html",
    "./data/**/*.{yaml,yml}",
  ],
  safelist: [
    'gradient-text',
  ],
  theme: {
    extend: {
      colors: {
        // Baseet Studio Color Profile
        'stroke': '#171D1C',
        'primary': '#496BC1',
        'secondary': '#C2CCCF',
        'tertiary': '#FBCD37',
        'surface': '#EBEBEB',
        
        // Semantic color mappings
        'brand': {
          DEFAULT: '#496BC1',
          dark: '#171D1C',
          light: '#EBEBEB',
          accent: '#FBCD37',
          muted: '#C2CCCF',
        },
        
        // Legacy compatibility
        'dark': '#171D1C',
        'light': '#EBEBEB',
      },
      backgroundColor: {
        'primary': '#496BC1',
        'secondary': '#EBEBEB',
        'tertiary': '#FBCD37',
        'accent': '#FBCD37',
      },
      textColor: {
        'primary': '#171D1C',
        'secondary': '#496BC1',
        'muted': '#C2CCCF',
      },
      borderColor: {
        'primary': '#171D1C',
        'secondary': '#C2CCCF',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      addUtilities({
        '.gradient-text': {
          'background': 'linear-gradient(135deg, #496BC1 0%, #FBCD37 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
          'font-size': 'clamp(2.5rem, 5vw, 4rem)',
          'font-weight': '800',
          'line-height': '1.1',
          'letter-spacing': '-0.02em',
          'display': 'inline-block',
        },
      });
    },
  ],
}
