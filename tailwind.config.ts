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
      keyframes: {
        spinGrowFade: {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.5) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(0) rotate(360deg)', opacity: '0' },
        },
      },
      animation: {
        spinGrowFade: 'spinGrowFade 1s ease-in-out forwards',
      },
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
