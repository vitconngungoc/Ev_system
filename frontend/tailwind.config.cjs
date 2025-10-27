/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#E53E3E",     // đỏ chủ đạo
        dark: "#0B1220",        // nền navy rất đậm
        slateDark: "#111827"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.10)",
        card: "0 14px 40px rgba(2,6,23,0.12)"
      },
      borderRadius: {
        xl2: "1rem"
      }
    },
  },
  plugins: [],
}
