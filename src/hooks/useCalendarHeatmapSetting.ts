import { useState } from "react";

import {
  readCalendarHeatmapEnabled,
  writeCalendarHeatmapEnabled,
} from "../lib/calendarHeatmapSettings";

export function useCalendarHeatmapSetting() {
  const [isCalendarHeatmapEnabled, setIsCalendarHeatmapEnabled] = useState(
    readCalendarHeatmapEnabled,
  );

  const updateCalendarHeatmapEnabled = (isEnabled: boolean) => {
    setIsCalendarHeatmapEnabled(isEnabled);
    writeCalendarHeatmapEnabled(isEnabled);
  };

  return {
    isCalendarHeatmapEnabled,
    updateCalendarHeatmapEnabled,
  };
}
