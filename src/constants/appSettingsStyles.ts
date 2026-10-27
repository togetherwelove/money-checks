import { StyleSheet } from "react-native";
import { AppSettingsUi } from "./appSettings";
import { AppColors } from "./colors";
import { MenuStyles } from "./menuStyles";
import { MenuDesign } from "./menuDesign";
import { NotificationBadgeUi } from "./notificationBadges";

export const AppSettingsRowStyles = StyleSheet.create({
  row: MenuStyles.row,
  title: MenuStyles.title,
  description: MenuStyles.description,
  embeddedRow: { paddingHorizontal: 0, paddingVertical: 0, minHeight: 0 },
  embeddedAction: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: MenuDesign.rowMinHeight - MenuDesign.verticalPadding * 2,
  },
  textBlock: MenuStyles.textBlock,
  lastRow: { borderBottomWidth: 0 },
  pressed: { backgroundColor: AppColors.surfaceMuted },
  disabled: { opacity: AppSettingsUi.disabledRowOpacity },
  notificationDot: {
    width: NotificationBadgeUi.bookSwitcherDotSize,
    height: NotificationBadgeUi.bookSwitcherDotSize,
    borderRadius: NotificationBadgeUi.bookSwitcherDotSize / 2,
    backgroundColor: AppColors.expense,
  },
});
