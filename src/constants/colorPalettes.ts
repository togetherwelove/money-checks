import appBrand from "../../app-brand.json";
import { FixedColors } from "./fixedColors";

export const LightColors = {
  appIconBackground: FixedColors.appIconBackground,
  // Surfaces and component backgrounds.
  background: FixedColors.white,
  screenBackground: FixedColors.white,
  adBackground: FixedColors.white,
  surface: FixedColors.white,
  surfaceStrong: "#eef1f0",
  surfaceMuted: "#f7f8f7",
  assetTint: "#f2f7f4",
  debtTint: "#fcf4f1",
  // Brand actions and transaction/status semantics.
  primary: "#235347",
  accent: "#c96c50",
  income: "#198754",
  success: "#3CB371",
  expense: "#b8543c",
  expenseSoft: "#fbe8e2",
  // Foregrounds specify the surface they are intended to appear on.
  text: "#1f2a28",
  mutedText: "#5f6d68",
  mutedStrongText: "#788680",
  onPrimary: FixedColors.white,
  onInverseSurface: FixedColors.white,
  border: "#d9dfdc",
  capsuleSurface: "#fafbfa",
  floatingPanelSurface: "#fafbfa",
  menuOverlay: "rgba(31, 42, 40, 0.08)",
  transparent: FixedColors.transparent,
  overlay: "rgba(31, 42, 40, 0.18)",
  loadingPanelOverlay: "rgba(255, 255, 255, 0.88)",
} as const;

export const LightChartColors = [
  LightColors.primary,
  LightColors.accent,
  "#d7a44a",
  "#6d8b74",
  "#8f6f95",
  "#4f759b",
] as const;

export type ThemeColors = { [Key in keyof typeof LightColors]: string };

export const DarkColors: ThemeColors = {
  ...LightColors,
  background: appBrand.darkScreenBackground,
  screenBackground: appBrand.darkScreenBackground,
  adBackground: "#1b2420",
  surface: "#1b2420",
  surfaceStrong: "#2b3731",
  surfaceMuted: "#202a25",
  assetTint: "#1b3026",
  debtTint: "#34251f",
  primary: "#8dccb5",
  onPrimary: "#10281f",
  onInverseSurface: appBrand.darkScreenBackground,
  accent: "#e89b80",
  income: "#68cf99",
  success: "#68cf99",
  expense: "#f09b82",
  expenseSoft: "#3c2822",
  text: "#edf3ef",
  mutedText: "#b0beb6",
  mutedStrongText: "#9baba2",
  border: "#3a4941",
  capsuleSurface: "#243029",
  floatingPanelSurface: "#243029",
  menuOverlay: "rgba(237, 243, 239, 0.08)",
  overlay: "rgba(0, 0, 0, 0.55)",
  loadingPanelOverlay: "rgba(18, 24, 22, 0.88)",
};

export const DarkChartColors = [
  DarkColors.primary,
  DarkColors.accent,
  "#e1bb6b",
  "#99bda0",
  "#bb9ac1",
  "#89afd1",
] as const;

export const LightHeatmapColors = {
  expense: [
    "rgba(184, 84, 60, 0.07)",
    "rgba(184, 84, 60, 0.1)",
    "rgba(184, 84, 60, 0.14)",
    "rgba(184, 84, 60, 0.19)",
    "rgba(184, 84, 60, 0.24)",
    "rgba(184, 84, 60, 0.3)",
    "rgba(184, 84, 60, 0.36)",
    "rgba(184, 84, 60, 0.43)",
    "rgba(184, 84, 60, 0.5)",
    "rgba(184, 84, 60, 0.58)",
  ],
  income: [
    "rgba(29, 122, 99, 0.05)",
    "rgba(29, 122, 99, 0.08)",
    "rgba(29, 122, 99, 0.11)",
    "rgba(29, 122, 99, 0.14)",
    "rgba(29, 122, 99, 0.17)",
    "rgba(29, 122, 99, 0.21)",
    "rgba(29, 122, 99, 0.25)",
    "rgba(29, 122, 99, 0.29)",
    "rgba(29, 122, 99, 0.33)",
    "rgba(29, 122, 99, 0.37)",
  ],
} as const;

export const DarkHeatmapColors = {
  expense: [
    "rgba(240, 155, 130, 0.08)",
    "rgba(240, 155, 130, 0.12)",
    "rgba(240, 155, 130, 0.16)",
    "rgba(240, 155, 130, 0.20)",
    "rgba(240, 155, 130, 0.24)",
    "rgba(240, 155, 130, 0.28)",
    "rgba(240, 155, 130, 0.32)",
    "rgba(240, 155, 130, 0.36)",
    "rgba(240, 155, 130, 0.40)",
    "rgba(240, 155, 130, 0.44)",
  ],
  income: [
    "rgba(104, 207, 153, 0.06)",
    "rgba(104, 207, 153, 0.09)",
    "rgba(104, 207, 153, 0.12)",
    "rgba(104, 207, 153, 0.15)",
    "rgba(104, 207, 153, 0.18)",
    "rgba(104, 207, 153, 0.21)",
    "rgba(104, 207, 153, 0.24)",
    "rgba(104, 207, 153, 0.27)",
    "rgba(104, 207, 153, 0.30)",
    "rgba(104, 207, 153, 0.33)",
  ],
} as const;
