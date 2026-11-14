import { createThemeValue } from "../lib/appTheme";
import { StyleSheet } from "react-native";
import { AppSettingsUi } from "./appSettings";
import { getAppColors } from "./colors";
import { getMenuStyles } from "./menuStyles";
import { MenuDesign } from "./menuDesign";
import { NotificationBadgeUi } from "./notificationBadges";

export const getAppSettingsRowStyles = createThemeValue(() =>
  StyleSheet.create({
    row: getMenuStyles().row,
    title: getMenuStyles().title,
    description: getMenuStyles().description,
    embeddedRow: { paddingHorizontal: 0, paddingVertical: 0, minHeight: 0 },
    embeddedAction: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      minHeight: MenuDesign.rowMinHeight - MenuDesign.verticalPadding * 2,
    },
    textBlock: getMenuStyles().textBlock,
    leadingIconSpace: { width: AppSettingsUi.selectionChevronIconSize },
    lastRow: { borderBottomWidth: 0 },
    pressed: { backgroundColor: getAppColors().surfaceMuted },
    disabled: { opacity: AppSettingsUi.disabledRowOpacity },
    notificationDot: {
      width: NotificationBadgeUi.bookSwitcherDotSize,
      height: NotificationBadgeUi.bookSwitcherDotSize,
      borderRadius: NotificationBadgeUi.bookSwitcherDotSize / 2,
      backgroundColor: getAppColors().expense,
    },
  }),
);
