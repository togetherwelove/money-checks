import { StyleSheet } from "react-native";
import { AppColors } from "./colors";
import { MenuDesign } from "./menuDesign";
import { ListGroupRowStyle, ListGroupStyle, ResponsivePageContentStyle } from "./uiStyles";

export const MenuStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.screenBackground },
  content: {
    ...ResponsivePageContentStyle,
    paddingHorizontal: MenuDesign.horizontalPadding,
    paddingTop: MenuDesign.screenTopPadding,
  },
  sections: { gap: MenuDesign.sectionGap },
  section: { gap: MenuDesign.contentGap },
  sectionTitle: {
    color: AppColors.mutedText,
    fontSize: MenuDesign.sectionFontSize,
    lineHeight: MenuDesign.sectionLineHeight,
    fontWeight: MenuDesign.fontWeight,
  },
  group: { ...ListGroupStyle, borderWidth: 0 },
  panel: {
    ...ListGroupStyle,
    borderWidth: 0,
    padding: MenuDesign.nestedPadding,
    gap: MenuDesign.contentGap,
  },
  row: {
    ...ListGroupRowStyle,
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
    color: AppColors.text,
    fontSize: MenuDesign.titleFontSize,
    lineHeight: MenuDesign.titleLineHeight,
    fontWeight: MenuDesign.fontWeight,
  },
  body: { color: AppColors.text, fontSize: MenuDesign.bodyFontSize, lineHeight: MenuDesign.bodyLineHeight },
  description: { color: AppColors.mutedText, fontSize: MenuDesign.descriptionFontSize, lineHeight: MenuDesign.descriptionLineHeight },
  lastRow: { borderBottomWidth: 0 },
});
