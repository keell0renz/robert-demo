const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // sRGB fallbacks for the oklch()/color-mix() the mirror-ui tokens emit.
    "@csstools/postcss-color-mix-function": { preserve: true },
    "@csstools/postcss-oklab-function": { preserve: true },
  },
};

export default config;
