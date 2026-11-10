import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#060709",
          900: "#0b0c10",
          850: "#101217",
          800: "#15181f",
          700: "#1e222c",
          600: "#2a303d",
          500: "#3d4556",
        },
        champagne: {
          DEFAULT: "#e8c88c",
          50: "#fdfaf3",
          100: "#fbf4e4",
          200: "#f6e6c4",
          300: "#edd19c",
          400: "#e8c88c",
          500: "#d9a857",
          600: "#ba8538",
          700: "#94632b",
        },
        vermilion: {
          DEFAULT: "#e65440",
          light: "#ff7460",
          dark: "#b83523",
        },
        sage: {
          DEFAULT: "#529471",
          light: "#78b594",
          dark: "#35664b",
        },
        copper: {
          DEFAULT: "#c67d5a",
          light: "#de9774",
          dark: "#9a5635",
        },
        azure: {
          DEFAULT: "#3e829a",
          light: "#60a8c2",
          dark: "#26596b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
