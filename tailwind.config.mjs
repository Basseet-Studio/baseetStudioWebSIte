import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#496BC1',
        secondary: '#C2CCCF',
        accent: '#FBCD37',
        dark: '#171D1C',
        light: '#EBEBEB',
      },
      fontFamily: {
        sans: defaultTheme.fontFamily.sans,
      },
    },
  },
  plugins: [],
}
