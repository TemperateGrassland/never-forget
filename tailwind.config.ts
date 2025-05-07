import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
        black: {
          css: {
            color: '#000',
            // headings, links etc. inherit from the base color unless you override:
            h1: { color: '#000' },
            h2: { color: '#000' },
            h3: { color: '#000' },
            a: { color: '#1d4ed8' }, 
          }
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
