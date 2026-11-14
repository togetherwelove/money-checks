export type ThemeMode = "system" | "light" | "dark";
export type AppColorScheme = "light" | "dark";

export const ThemeSettings = {
  storageKey: "money-checks.settings.theme",
  title: "화면 모드",
} as const;

export const ThemeModeOptions: readonly { label: string; value: ThemeMode }[] = [
  { label: "시스템 설정 따르기", value: "system" },
  { label: "라이트", value: "light" },
  { label: "다크", value: "dark" },
];
