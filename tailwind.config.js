/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          border: "hsl(var(--sidebar-border))",
        },
        gold: {
          DEFAULT: "#FBBF33",
          light: "#FFD666",
          dark: "#c9960a",
        },
        navy: {
          DEFAULT: "#0F1C30",
          light: "#1A2E47",
          dark: "#0a1322",
        },
        orange: {
          DEFAULT: "#FF7433",
          light: "#FF9966",
          dark: "#cc5520",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      fontFamily: {
        heading: ["Sora", "system-ui", "sans-serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 1px 2px hsla(214, 53%, 12%, 0.04), 0 4px 16px hsla(214, 53%, 12%, 0.06), 0 0 0 1px hsla(214, 53%, 12%, 0.04)",
        "premium-lg": "0 2px 4px hsla(214, 53%, 12%, 0.04), 0 8px 32px hsla(214, 53%, 12%, 0.08), 0 0 0 1px hsla(42, 96%, 59%, 0.06)",
        glow: "0 0 20px hsla(42, 96%, 59%, 0.15), 0 0 40px hsla(42, 96%, 59%, 0.05)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out forwards",
        shimmer: "shimmer 3s infinite",
      },
    },
  },
  plugins: [],
}
