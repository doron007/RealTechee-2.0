/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      'xxl': '1400px', // New breakpoint between xl and 2xl
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Updated brand colors from Figma
        "black": "#151515",
        "dark-gray": "#2A2B2E",
        "medium-gray": "#6E6E73",
        "light-gray": "#919191",
        "very-light-gray": "#E4E4E4",
        "off-white": "#F9F4F3",
        
        // Primary/Secondary colors
        primary: "#151515", 
        secondary: "#FFFFFF",
        "neutral-light": "#D2CAC8",
        
        // Accent colors
        "accent-1": "#D11919", // Red
        "accent-2": "#E9664A", // Coral/Orange
        "accent-3": "#FFB900", // Yellow
        "accent-4": "#3BE8B0", // Teal
        "accent-5": "#17619C", // Blue
        
        // Button states
        "btn-normal": "#CE635E",
        "btn-hover": "#A54F4B",
        "btn-pressed": "#7C3B38",
        "btn-disabled": "#F0CFCD",
        
        // Keep existing structure 
        accent: "#2A2B2E",
        "accent-hover": "#151515",
        "accent-light": "#6E6E73",
        "text-primary": "#151515",
        "text-secondary": "#2A2B2E",
        "text-muted": "#6E6E73",
        "bg-light": "#F9F4F3",
        "bg-dark": "#151515",
        "border-color": "#E4E4E4",
        
        // Additional colors
        "accent-red": "#D11919",
        "accent-coral": "#E9664A",
        "accent-yellow": "#FFB900",
        "accent-teal": "#3BE8B0",
        "accent-blue": "#17619C",
      },
      fontFamily: {
        sans: ["Inter", "Nunito Sans", "Roboto", "sans-serif"],
        heading: ["Nunito Sans", "sans-serif"],
        body: ["Roboto", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        playfair: ["Playfair Display", "serif"]
      },
      fontSize: {
        // Responsive font sizing system
        'xs': ['13pt', { lineHeight: '1.4' }], // P3
        'sm': ['0.875rem', { lineHeight: '1.4' }],
        'base': ['16pt', { lineHeight: '1.5' }], // P2 / H6
        'lg': ['1.125rem', { lineHeight: '1.5' }],
        'xl': ['20pt', { lineHeight: '1.4' }], // P1 / H5
        '2xl': ['25pt', { lineHeight: '1.3' }], // H4
        '3xl': ['31pt', { lineHeight: '1.2' }], // H3
        '4xl': ['39pt', { lineHeight: '1.2' }], // H2
        '5xl': ['48pt', { lineHeight: '1.1' }], // H1
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
        '7xl': ['4.5rem', { lineHeight: '1.1' }],
        '2xs': ['0.625rem', { lineHeight: '1.4' }],
        
        // Responsive sizes that will scale down on smaller screens
        'responsive-xs': ['13pt', { lineHeight: '1.4' }],
        'responsive-sm': ['14pt', { lineHeight: '1.4' }],
        'responsive-base': ['16pt', { lineHeight: '1.5' }],
        'responsive-lg': ['18pt', { lineHeight: '1.5' }],
        'responsive-xl': ['20pt', { lineHeight: '1.4' }],
        'responsive-2xl': ['25pt', { lineHeight: '1.3' }],
        'responsive-3xl': ['31pt', { lineHeight: '1.2' }],
        'responsive-4xl': ['39pt', { lineHeight: '1.2' }],
        'responsive-5xl': ['48pt', { lineHeight: '1.1' }],
      },
      lineHeight: {
        'tight': '1.2', // 120%
        'normal': '1.4', // 140%
        'relaxed': '1.5', // 150%
        'loose': '1.6',  // 160%
        'extra-loose': '1.8', // 180%
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
        "hero-pattern": "url('/assets/images/shared_hero-pattern.svg')",
        "cta-pattern": "url('/assets/images/shared_cta-pattern.svg')",
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.text-responsive': {
          'font-size': 'clamp(16px, 2vw, 20px)',
        },
        '.text-responsive-heading': {
          'font-size': 'clamp(24px, 4vw, 48px)',
        },
      }
      addUtilities(newUtilities)
    },
  ],
}