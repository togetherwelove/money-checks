import {
  DarkHeatmapColors,
  LightHeatmapColors,
  DarkChartColors,
  DarkColors,
  LightChartColors,
  LightColors,
} from "./colorPalettes";
import { getAppColorScheme } from "../lib/appTheme";

export function getAppColors() {
  return getAppColorScheme() === "dark" ? DarkColors : LightColors;
}

export function getAppChartColors() {
  return getAppColorScheme() === "dark" ? DarkChartColors : LightChartColors;
}

export function getAppHeatmapColors() {
  return getAppColorScheme() === "dark" ? DarkHeatmapColors : LightHeatmapColors;
}
