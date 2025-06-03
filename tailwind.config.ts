import { type Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ffff45",
          dark: "#ffff45",
        },
        secondary: {
          DEFAULT: "#edf2ff",
          dark: "#91A6FF",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
