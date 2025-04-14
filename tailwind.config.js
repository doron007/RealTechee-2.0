/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#333333",
        secondary: "#FFFFFF",
        accent: "#FF5F45",
        "accent-hover": "#E54935",
        "accent-light": "#FF8A70",
        "text-primary": "#333333",
        "text-secondary": "#666666",
        "text-muted": "#999999",
        "bg-light": "#F5F5F5",
        "bg-dark": "#333333",
        "border-color": "#EEEEEE",
        // Additional brand colors
        "accent-red": "#E1271A",
        "accent-coral": "#FF7F59",
        "accent-yellow": "#FFB81C",
        "accent-teal": "#4CD5B1",
        "accent-blue": "#1D70B7",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        "2xs": "0.625rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
        "6xl": "3.75rem",
        "7xl": "4.5rem",
      },
      spacing: {
        "72": "18rem",
        "84": "21rem",
        "96": "24rem",
        "128": "32rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)",
        "card-hover": "0 10px 25px rgba(0, 0, 0, 0.08), 0 5px 10px rgba(0, 0, 0, 0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
      backgroundImage: {
        "hero-pattern": "url('/images/hero-pattern.svg')",
        "cta-pattern": "url('/images/cta-pattern.svg')",
      },
    },
  },
  plugins: [],
}