module.exports = {
  globDirectory: "dist",
  globPatterns: ["**/*.{css,html,ico,jpg,jpeg,js,json,png,svg,ttf,txt,webmanifest,woff,woff2}"],
  swDest: "dist/sw.js",
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  navigateFallback: "/index.html",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
};
