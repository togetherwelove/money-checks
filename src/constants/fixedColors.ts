import appBrand from "../../app-brand.json";

/** Brand assets and system control details that keep their color in both appearances. */
export const FixedColors = {
  appIconBackground: appBrand.appIconBackground,
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
} as const;
