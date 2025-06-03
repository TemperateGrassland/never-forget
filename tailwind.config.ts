import type { Config } from "tailwindcss";
import typography from '@tailwindcss/typography'

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/*/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        agrandir: ['"Agrandir"', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#000',      // base text
            h1: { color: '#000' },
            h2: { color: '#000' },
            a: { color: '#1d4ed8' } 
          }
        }
      }
    },
  },
  plugins: [typography],
} satisfies Config;
