import { StyleSheet } from "react-native";
import { createThemeValue } from "../lib/appTheme";
import { getAppColors } from "./colors";
import { AllEntriesFilterDesign as Design, AllEntriesFilterUi as Ui } from "./allEntries";
import { getSettingsGroupStyles, SettingsGroupDesign as Group } from "./settingsGroupStyles";
import { AppLayout } from "./layout";
export const getAllEntriesFilterStyles = createThemeValue(() =>
  StyleSheet.create({
    section: { gap: Group.contentGap },
    heading: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: Group.titleGap,
    },
    title: { ...getSettingsGroupStyles().label, fontWeight: "600" },
    count: { color: getAppColors().mutedText, fontSize: Ui.sectionLabelFontSize },
    options: { flexDirection: "row", flexWrap: "wrap", gap: Group.titleGap },
    option: {
      flexBasis: "30%",
      flexGrow: 1,
      borderWidth: Group.borderWidth,
      borderColor: getAppColors().border,
      borderRadius: Ui.filterButtonMinimumHeight / 2,
      minHeight: Ui.filterButtonMinimumHeight,
      paddingHorizontal: Ui.categoryChipHorizontalPadding,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: getAppColors().surface,
    },
    optionLabel: { color: getAppColors().mutedText, fontSize: Ui.typeOptionFontSize },
    selected: {
      backgroundColor: getAppColors().surfaceStrong,
      borderColor: getAppColors().primary,
    },
    selectedLabel: { color: getAppColors().primary, fontWeight: "600" },
    dateFields: { flexDirection: "row", gap: Group.titleGap },
    dateField: {
      flex: 1,
      minWidth: 0,
      gap: Group.textGap,
      padding: Group.verticalPadding,
      borderRadius: Design.tileRadius,
      borderWidth: Group.borderWidth,
      borderColor: getAppColors().border,
      backgroundColor: getAppColors().surfaceMuted,
    },
    dateCaption: { color: getAppColors().mutedText, fontSize: Group.descriptionFontSize },
    dateValue: { ...getSettingsGroupStyles().label, fontWeight: "500" },
    calendar: {
      backgroundColor: getAppColors().surfaceMuted,
      borderRadius: Design.tileRadius,
      padding: AppLayout.compactGap,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: Group.titleGap },
    tile: {
      flexBasis: "30%",
      minHeight: Design.categoryTileHeight,
      padding: Design.categoryTilePadding,
      gap: Design.categoryTileContentGap,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: Design.tileRadius,
      borderWidth: Group.borderWidth,
      borderColor: getAppColors().border,
      backgroundColor: getAppColors().surface,
    },
    tileLabel: {
      color: getAppColors().text,
      fontSize: Ui.categoryLabelFontSize,
      textAlign: "center",
    },
    selectionBadge: {
      position: "absolute",
      top: AppLayout.compactGap,
      right: AppLayout.compactGap,
      width: Design.selectionBadgeSize,
      height: Design.selectionBadgeSize,
      borderRadius: Design.selectionBadgeSize / 2,
      backgroundColor: getAppColors().primary,
      alignItems: "center",
      justifyContent: "center",
    },
  }),
);
