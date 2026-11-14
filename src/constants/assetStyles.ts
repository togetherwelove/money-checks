import { createThemeValue } from "../lib/appTheme";
import { StyleSheet } from "react-native";
import { getAppColors } from "./colors";
import { AppLayout } from "./layout";
import { EntryComposerUi } from "./entryComposer";
import {
  getFormLabelTextStyle,
  getSupportingTextStyle,
  getUnderlineFormInputTextStyle,
} from "./uiStyles";

export const getAssetStyles = createThemeValue(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: getAppColors().screenBackground },
    content: {
      padding: AppLayout.cardContentPadding,
      gap: AppLayout.cardContentPadding,
      width: "100%",
      maxWidth: AppLayout.pageContentMaxWidth,
      alignSelf: "center",
    },
    section: { gap: AppLayout.cardGap },
    card: {
      padding: AppLayout.cardContentPadding,
      borderRadius: AppLayout.cardRadius,
      backgroundColor: getAppColors().surfaceMuted,
      gap: AppLayout.cardGap,
    },
    assetCard: {
      backgroundColor: getAppColors().surface,
      borderWidth: AppLayout.dividerWidth,
      borderColor: getAppColors().border,
    },
    assetCardPressed: { backgroundColor: getAppColors().surfaceStrong },
    assetTint: { backgroundColor: getAppColors().assetTint },
    debtTint: { backgroundColor: getAppColors().debtTint },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: AppLayout.cardGap,
      minHeight: EntryComposerUi.fieldHeight,
      paddingVertical: AppLayout.compactGap,
    },
    assetHeadingRow: { minHeight: 0, paddingVertical: 0 },
    wrap: { flexDirection: "row", flexWrap: "wrap", gap: AppLayout.cardGap },
    grow: { flex: 1 },
    title: {
      color: getAppColors().text,
      fontSize: EntryComposerUi.sheetFieldFontSize,
      fontWeight: "600",
    },
    amount: {
      color: getAppColors().primary,
      fontSize: EntryComposerUi.sheetAmountFontSize,
      fontWeight: "700",
    },
    text: { color: getAppColors().text, fontSize: EntryComposerUi.sheetFieldFontSize },
    hint: getSupportingTextStyle(),
    label: getFormLabelTextStyle(),
    input: { ...getUnderlineFormInputTextStyle(), minHeight: EntryComposerUi.sheetFieldHeight },
    chip: {
      padding: AppLayout.cardGap,
      borderRadius: AppLayout.cardRadius,
      backgroundColor: getAppColors().surfaceMuted,
    },
    selected: { backgroundColor: getAppColors().primary },
    debtHeading: {
      color: getAppColors().expense,
      fontSize: EntryComposerUi.sheetFieldFontSize,
      fontWeight: "600",
    },
    selectedText: { color: getAppColors().onPrimary },
    error: { ...getSupportingTextStyle(), color: getAppColors().expense },
    action: {
      color: getAppColors().primary,
      fontSize: EntryComposerUi.sheetFieldFontSize,
      fontWeight: "600",
    },
    delete: { color: getAppColors().expense, fontSize: EntryComposerUi.sheetFieldFontSize },
    disabled: { opacity: EntryComposerUi.disabledOpacity },
  }),
);
