import { appStorage } from "./appStorage";

const CALENDAR_HEATMAP_ENABLED_STORAGE_KEY = "money-checks.settings.calendar-heatmap-enabled";
const ENABLED_VALUE = "true";
const DISABLED_VALUE = "false";

export function readCalendarHeatmapEnabled(): boolean {
  return appStorage.getItem(CALENDAR_HEATMAP_ENABLED_STORAGE_KEY) !== DISABLED_VALUE;
}

export function writeCalendarHeatmapEnabled(isEnabled: boolean): void {
  appStorage.setItem(
    CALENDAR_HEATMAP_ENABLED_STORAGE_KEY,
    isEnabled ? ENABLED_VALUE : DISABLED_VALUE,
  );
}
