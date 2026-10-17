import { StyleSheet } from "react-native";
import { AppSettingsUi } from "./appSettings";
import { AppColors } from "./colors";
import { AppLayout } from "./layout";
import { ListGroupRowStyle } from "./uiStyles";

export const AppSettingsRowStyles = StyleSheet.create({
  row: {
    ...ListGroupRowStyle,
    alignItems: "center",
    flexDirection: "row",
    gap: AppSettingsUi.sectionGap,
    justifyContent: "space-between",
    minHeight: AppSettingsUi.rowMinHeight,
  },
  title: {
    color: AppColors.text,
    fontSize: AppSettingsUi.rowTitleFontSize,
    fontWeight: "800",
  },
  textBlock: { flex: 1, gap: AppLayout.compactGap, minWidth: 0 },
  lastRow: { borderBottomWidth: 0 },
  pressed: { backgroundColor: AppColors.surfaceMuted },
  disabled: { opacity: AppSettingsUi.disabledRowOpacity },
});
