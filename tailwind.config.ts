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
          DEFAULT: "#A31E5E",
          dark: "#e34484",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
