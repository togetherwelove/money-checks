import { AppFontSize, AppLineHeight } from "./typography";
import { ResponsivePageContentStyle } from "./uiStyles";
import { MenuDesign } from "./menuDesign";
import { StyleSheet } from "react-native";
import { createThemeValue } from "../lib/appTheme";
import { getAppColors } from "./colors";

const GROUP_RADIUS = 28;
const GROUP_BORDER_WIDTH = 1;
const SINGLE_LINE_HEIGHT = GROUP_RADIUS * 2;
const SINGLE_LINE_CONTENT_HEIGHT = SINGLE_LINE_HEIGHT - GROUP_BORDER_WIDTH * 2;
const INPUT_HEIGHT = 36;
const SINGLE_LINE_VERTICAL_PADDING = (SINGLE_LINE_CONTENT_HEIGHT - INPUT_HEIGHT) / 2;

export const SettingsGroupDesign = {
  radius: GROUP_RADIUS,
  singleLineHeight: SINGLE_LINE_HEIGHT,
  singleLineFieldVerticalPadding: SINGLE_LINE_VERTICAL_PADDING,
  rowVerticalPadding: SINGLE_LINE_VERTICAL_PADDING,
  pageTopPadding: 16,
  pageBottomPadding: 24,
  fieldMinHeight: INPUT_HEIGHT,
  multilineMinHeight: 112,
  compactValueFontSize: AppFontSize.body,
  heroFontSize: AppFontSize.display,
  heroLineHeight: AppLineHeight.display,
  borderWidth: GROUP_BORDER_WIDTH,
  horizontalPadding: 18,
  verticalPadding: 16,
  rowMinHeight: SINGLE_LINE_CONTENT_HEIGHT,
  iconSize: 22,
  contentGap: 14,
  textGap: 4,
  sectionGap: 28,
  titleGap: 8,
  titleFontSize: AppFontSize.body,
  countFontSize: AppFontSize.caption,
  countLineHeight: AppLineHeight.caption,
  labelFontSize: AppFontSize.label,
  labelLineHeight: AppLineHeight.label,
  descriptionFontSize: AppFontSize.body,
  descriptionLineHeight: AppLineHeight.body,
} as const;

export const getSettingsGroupStyles = createThemeValue(() =>
  StyleSheet.create({
    page: {
      ...ResponsivePageContentStyle,
      paddingHorizontal: MenuDesign.horizontalPadding,
      paddingTop: SettingsGroupDesign.pageTopPadding,
      paddingBottom: SettingsGroupDesign.pageBottomPadding,
    },
    section: { gap: SettingsGroupDesign.titleGap, alignSelf: "stretch", minWidth: 0 },
    sections: { gap: SettingsGroupDesign.sectionGap },
    count: {
      color: getAppColors().mutedStrongText,
      fontSize: SettingsGroupDesign.countFontSize,
      includeFontPadding: false,
      lineHeight: SettingsGroupDesign.countLineHeight,
    },
    heading: {
      color: getAppColors().mutedText,
      fontSize: SettingsGroupDesign.labelFontSize,
      lineHeight: SettingsGroupDesign.labelLineHeight,
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
    },
    card: {
      backgroundColor: getAppColors().surface,
      borderColor: getAppColors().border,
      borderWidth: SettingsGroupDesign.borderWidth,
      borderRadius: SettingsGroupDesign.radius,
      overflow: "hidden",
    },
    singleLineField: {
      minHeight: SettingsGroupDesign.rowMinHeight,
      justifyContent: "center",
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
      paddingVertical: SettingsGroupDesign.singleLineFieldVerticalPadding,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: getAppColors().border,
    },
    body: {
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
      paddingVertical: SettingsGroupDesign.verticalPadding,
      gap: SettingsGroupDesign.contentGap,
    },
    field: {
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
      paddingVertical: SettingsGroupDesign.verticalPadding,
      gap: SettingsGroupDesign.textGap,
    },
    singleLineInput: {
      color: getAppColors().text,
      fontSize: SettingsGroupDesign.labelFontSize,
      minHeight: SettingsGroupDesign.fieldMinHeight,
      paddingHorizontal: 0,
      paddingVertical: 0,
      borderWidth: 0,
      textAlign: "left",
    },
    inputUnderline: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: getAppColors().border,
    },
    leadingValue: {
      color: getAppColors().text,
      fontSize: SettingsGroupDesign.labelFontSize,
      lineHeight: SettingsGroupDesign.labelLineHeight,
    },
    labelRow: { flexDirection: "row", alignItems: "center", gap: SettingsGroupDesign.textGap },
    accessoryLabel: { flexShrink: 1 },
    rightAlignedLabel: { textAlign: "right" },
    content: { flex: 1, minWidth: 0, gap: SettingsGroupDesign.textGap },
    trailing: { flexShrink: 1, alignItems: "flex-end" },
    value: {
      color: getAppColors().mutedText,
      fontSize: SettingsGroupDesign.labelFontSize,
      lineHeight: SettingsGroupDesign.labelLineHeight,
      textAlign: "right",
    },
    input: {
      color: getAppColors().text,
      backgroundColor: getAppColors().surface,
      fontSize: SettingsGroupDesign.labelFontSize,
      lineHeight: SettingsGroupDesign.labelLineHeight,
      minHeight: SettingsGroupDesign.fieldMinHeight,
      paddingHorizontal: 0,
      paddingVertical: 0,
      borderWidth: 0,
    },
    pressed: { backgroundColor: getAppColors().surfaceMuted },
    destructive: { color: getAppColors().expense },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 0,
      backgroundColor: getAppColors().surface,
      minHeight: SettingsGroupDesign.rowMinHeight,
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
      paddingVertical: SettingsGroupDesign.rowVerticalPadding,
      gap: SettingsGroupDesign.contentGap,
    },
    label: {
      color: getAppColors().text,
      fontSize: SettingsGroupDesign.labelFontSize,
      lineHeight: SettingsGroupDesign.labelLineHeight,
      fontWeight: "400",
    },
    caption: {
      color: getAppColors().mutedText,
      fontSize: SettingsGroupDesign.descriptionFontSize,
      lineHeight: SettingsGroupDesign.descriptionLineHeight,
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
      textAlign: "left",
    },
    description: {
      color: getAppColors().mutedText,
      fontSize: SettingsGroupDesign.descriptionFontSize,
      lineHeight: SettingsGroupDesign.descriptionLineHeight,
    },
    textBlock: { gap: SettingsGroupDesign.textGap },
    leadingIconSpace: { width: SettingsGroupDesign.iconSize },
  }),
);
