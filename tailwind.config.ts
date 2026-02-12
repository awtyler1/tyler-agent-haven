import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Outfit", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Lora", "Georgia", "'Times New Roman'", "serif"],
      },
      colors: {
        /* Shadcn/Radix tokens (HSL from CSS vars) */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
        },
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
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* Homestead tokens (direct hex/rgba values) */
        homestead: {
          bg: "var(--bg)",
          "bg-subtle": "var(--bg-subtle)",
          "bg-muted": "var(--bg-muted)",
          "bg-card": "var(--bg-card)",
          "bg-warm-glow": "var(--bg-warm-glow)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          dark: "var(--gold-dark)",
        },
        "hs-sidebar": {
          DEFAULT: "var(--sidebar)",
          border: "var(--sidebar-border)",
          hover: "var(--sidebar-hover)",
          text: "var(--sidebar-text)",
          "text-active": "var(--sidebar-text-active)",
          "section-label": "var(--sidebar-section-label)",
        },
        "hs-text": {
          primary: "var(--text-primary)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        },
        "hs-green": {
          DEFAULT: "var(--green)",
          bg: "var(--green-bg)",
        },
        "hs-amber": "var(--amber)",
        "hs-red": "var(--red)",
        "hs-blue": "var(--blue)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "land-bounce": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.012)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "scale-in": "scale-in 0.5s ease-out forwards",
        "fade-up": "fade-up var(--med) var(--ease) forwards",
        "land-bounce": "land-bounce 0.3s var(--ease)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
