module.exports = {
  globDirectory: "dist",
  globPatterns: ["**/*.{html,js,json,ico,png,svg,ttf,woff2}"],
  swDest: "dist/sw.js",
  clientsClaim: true,
  skipWaiting: true,
  navigateFallback: "/index.html",
};
