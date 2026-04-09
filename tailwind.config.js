/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        secondary: "#EC4899",
        accent: "#F59E0B",
        dark: "#1F2937",
        light: "#F9FAFB",
      },
    },
  },
  plugins: [],
};
