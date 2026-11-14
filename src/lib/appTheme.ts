import { Appearance } from "react-native";
import { ThemeSettings, type ThemeMode, type AppColorScheme } from "../constants/theme";
import { appStorage } from "./appStorage";

const listeners = new Set<() => void>();
const storedMode = appStorage.getItem(ThemeSettings.storageKey);
let mode: ThemeMode = storedMode === "light" || storedMode === "dark" ? storedMode : "system";
let systemScheme: AppColorScheme = Appearance.getColorScheme() === "dark" ? "dark" : "light";

export const getThemeMode = () => mode;
export const getAppColorScheme = (): AppColorScheme => (mode === "system" ? systemScheme : mode);
export const getThemeSnapshot = () => `${mode}:${getAppColorScheme()}`;
export const subscribeAppTheme = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const notify = () => {
  for (const listener of listeners) listener();
};

export function setThemeMode(next: ThemeMode) {
  appStorage.setItem(ThemeSettings.storageKey, next);
  mode = next;
  Appearance.setColorScheme(next === "system" ? "auto" : next);
  systemScheme = Appearance.getColorScheme() === "dark" ? "dark" : "light";
  notify();
}

export function observeSystemTheme() {
  Appearance.setColorScheme(mode === "system" ? "auto" : mode);
  systemScheme = Appearance.getColorScheme() === "dark" ? "dark" : "light";
  notify();
  const subscription = Appearance.addChangeListener(({ colorScheme }) => {
    systemScheme = colorScheme === "dark" ? "dark" : "light";
    if (mode === "system") notify();
  });
  return () => subscription.remove();
}

/** Evaluate shared styles once per palette, without freezing colors at module load. */
export function createThemeValue<Value>(create: () => Value): () => Value {
  const values = new Map<AppColorScheme, Value>();
  return () => {
    const scheme = getAppColorScheme();
    if (!values.has(scheme)) values.set(scheme, create());
    return values.get(scheme) as Value;
  };
}
