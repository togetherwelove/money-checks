import type { NativeStackHeaderItemButton } from "@react-navigation/native-stack";
import { getAppColors } from "../constants/colors";
import { HomeScreenCopy } from "../constants/home";
import { toIsoDate } from "../utils/calendar";

export function createCalendarTodayButton(
  selectedDate: string,
  onSelectDate: (date: string) => void,
): NativeStackHeaderItemButton {
  const disabled = selectedDate === toIsoDate(new Date());
  return {
    type: "button",
    label: HomeScreenCopy.todayAction,
    accessibilityLabel: HomeScreenCopy.todayAccessibilityLabel,
    variant: "plain",
    hidesSharedBackground: false,
    sharesBackground: false,
    tintColor: getAppColors().primary,
    disabled,
    onPress: () => {
      if (!disabled) onSelectDate(toIsoDate(new Date()));
    },
  };
}
