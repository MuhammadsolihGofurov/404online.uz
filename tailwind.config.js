/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
      },
      colors: {
        main: "var(--color-main)",
        textPrimary: "var(--color-text-primary)",
        textSecondary: "var(--color-text-secondary)",
        inputPlaceholder: "var(--color-input-placeholder)",
        menu: "var(--color-menu)",
        buttonGrey: "var(--color-button-grey)",
        active: "var(--color-active)",
        activeBg: "var(--color-active-bg)",
        blocked: "var(--color-blocked)",
        blockedBg: "var(--color-blocked-bg)",
        progress: "var(--color-progress)",
        progressBg: "var(--color-progress-bg)",
        dashboardBg: "var(--color-dashboard-bg)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "main-linear": "linear-gradient(-45deg, #868CFF 0%, #23BDEE 100%)",
      },
      screens: {
        small: "360px",
        // => @media (min-width: 360px) { ... }

        xs: "450px",
        // => @media (min-width: 450px) { ... }

        sm: "580px",
        // => @media (min-width: 580px) { ... }

        // ms: "650px",
        // => @media (min-width: 650px) { ... }

        md: "768px",
        // => @media (min-width: 768px) { ... }

        lg: "992px",
        // => @media (min-width: 992px) { ... }

        "2xl": "1200px",
        // => @media (min-width: 1200px) { ... }

        "4xl": "1300px",
        // => @media (min-width: 1200px) { ... }

        "6xl": "1440px",
        // => @media (min-width: 1440px) { ... }

        "8xl": "1540px",
        // => @media (min-width: 1540px) { ... }
      },
    },
  },
  plugins: [],
};
