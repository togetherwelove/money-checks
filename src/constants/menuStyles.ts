import { createThemeValue } from "../lib/appTheme";
import { StyleSheet } from "react-native";
import { getAppColors } from "./colors";
import { MenuDesign } from "./menuDesign";
import { getListGroupRowStyle, getListGroupStyle, ResponsivePageContentStyle } from "./uiStyles";

export const getMenuStyles = createThemeValue(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: getAppColors().screenBackground },
    content: {
      ...ResponsivePageContentStyle,
      paddingHorizontal: MenuDesign.horizontalPadding,
      paddingTop: MenuDesign.screenTopPadding,
    },
    sections: { gap: MenuDesign.sectionGap },
    section: { gap: MenuDesign.contentGap },
    sectionTitle: {
      color: getAppColors().mutedText,
      fontSize: MenuDesign.sectionFontSize,
      lineHeight: MenuDesign.sectionLineHeight,
      fontWeight: MenuDesign.fontWeight,
    },
    group: { ...getListGroupStyle(), borderWidth: 0 },
    panel: {
      ...getListGroupStyle(),
      borderWidth: 0,
      padding: MenuDesign.nestedPadding,
      gap: MenuDesign.contentGap,
    },
    row: {
      ...getListGroupRowStyle(),
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: MenuDesign.nestedPadding,
      paddingVertical: MenuDesign.verticalPadding,
      minHeight: MenuDesign.rowMinHeight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: MenuDesign.contentGap,
    },
    textBlock: { flex: 1, minWidth: 0, gap: MenuDesign.textGap },
    title: {
      color: getAppColors().text,
      fontSize: MenuDesign.titleFontSize,
      lineHeight: MenuDesign.titleLineHeight,
      fontWeight: MenuDesign.fontWeight,
    },
    body: {
      color: getAppColors().text,
      fontSize: MenuDesign.bodyFontSize,
      lineHeight: MenuDesign.bodyLineHeight,
    },
    description: {
      color: getAppColors().mutedText,
      fontSize: MenuDesign.descriptionFontSize,
      lineHeight: MenuDesign.descriptionLineHeight,
    },
    lastRow: { borderBottomWidth: 0 },
  }),
);
