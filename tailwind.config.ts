import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bengali: ["var(--font-noto-serif-bengali)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
