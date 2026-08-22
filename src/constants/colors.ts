import appBrand from "../../app-brand.json";

export const AppColors = {
  appIconBackground: appBrand.appIconBackground,
  background: "#ffffff",
  screenBackground: "#ffffff",
  adBackground: "#ffffff",
  surface: "#ffffff",
  surfaceStrong: "#eef1f0",
  surfaceMuted: "#f7f8f7",
  primary: "#235347",
  accent: "#c96c50",
  income: "#198754",
  success: "#3CB371",
  expense: "#b8543c",
  expenseSoft: "#fbe8e2",
  text: "#1f2a28",
  mutedText: "#5f6d68",
  mutedStrongText: "#788680",
  inverseText: "#ffffff",
  border: "#d9dfdc",
  capsuleSurface: "#fafbfa",
  floatingPanelSurface: "rgba(250, 251, 250, 0.97)",
  menuOverlay: "rgba(31, 42, 40, 0.08)",
  transparent: "transparent",
  overlay: "rgba(31, 42, 40, 0.18)",
} as const;

export const AppChartColors = [
  AppColors.primary,
  AppColors.accent,
  "#d7a44a",
  "#6d8b74",
  "#8f6f95",
  "#4f759b",
] as const;
