import type { NativeStackHeaderItemButton } from "@react-navigation/native-stack";
import { getAppColors } from "../constants/colors";
import { HomeScreenCopy } from "../constants/home";
import { toIsoDate } from "../utils/calendar";
import { createNativeHeaderTextButton } from "./nativeHeaderTextButton";

export function createCalendarTodayButton(
  selectedDate: string,
  onSelectDate: (date: string) => void,
): NativeStackHeaderItemButton {
  return createNativeHeaderTextButton({
    label: HomeScreenCopy.todayAction,
    accessibilityLabel: HomeScreenCopy.todayAccessibilityLabel,
    tintColor: getAppColors().primary,
    disabled: selectedDate === toIsoDate(new Date()),
    onPress: () => onSelectDate(toIsoDate(new Date())),
  });
}
