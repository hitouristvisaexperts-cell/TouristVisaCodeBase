import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))", soft: "hsl(var(--primary-soft))" },
        navy: { DEFAULT: "hsl(var(--navy))", foreground: "hsl(var(--navy-foreground))", soft: "hsl(var(--navy-soft))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: {
          DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))",
          purple: "hsl(var(--accent-purple))", "purple-soft": "hsl(var(--accent-purple-soft))",
          blue: "hsl(var(--accent-blue))", "blue-soft": "hsl(var(--accent-blue-soft))",
          green: "hsl(var(--accent-green))", "green-soft": "hsl(var(--accent-green-soft))",
          amber: "hsl(var(--accent-amber))", "amber-soft": "hsl(var(--accent-amber-soft))",
        },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        /* passport theme */
        "passport-navy":      "#1a2a5e",
        "passport-navy-deep": "#0f1d45",
        "passport-gold":      "#d4a843",
        "passport-orange":    "#d96b1e",
        "passport-cream":     "#faf6ee",
        "passport-paper":     "#f3ebe0",
        "stamp-blue":         "#1e3d8f",
        "stamp-red":          "#c24520",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        serif: ["'Playfair Display'", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)", "2xl": "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
