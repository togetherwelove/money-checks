import { StyleSheet } from "react-native";
import { AppColors } from "./colors";
import { AppLayout } from "./layout";
import { EntryComposerUi } from "./entryComposer";
import { FormLabelTextStyle, SupportingTextStyle, UnderlineFormInputTextStyle } from "./uiStyles";

export const AssetStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.screenBackground },
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
    backgroundColor: AppColors.surfaceMuted,
    gap: AppLayout.cardGap,
  },
  assetCard: {
    backgroundColor: AppColors.surface,
    borderWidth: AppLayout.dividerWidth,
    borderColor: AppColors.border,
  },
  assetCardPressed: { backgroundColor: AppColors.surfaceStrong },
  assetTint: { backgroundColor: AppColors.assetTint },
  debtTint: { backgroundColor: AppColors.debtTint },
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
  title: { color: AppColors.text, fontSize: EntryComposerUi.sheetFieldFontSize, fontWeight: "600" },
  amount: {
    color: AppColors.primary,
    fontSize: EntryComposerUi.sheetAmountFontSize,
    fontWeight: "700",
  },
  text: { color: AppColors.text, fontSize: EntryComposerUi.sheetFieldFontSize },
  hint: SupportingTextStyle,
  label: FormLabelTextStyle,
  input: { ...UnderlineFormInputTextStyle, minHeight: EntryComposerUi.sheetFieldHeight },
  chip: {
    padding: AppLayout.cardGap,
    borderRadius: AppLayout.cardRadius,
    backgroundColor: AppColors.surfaceMuted,
  },
  selected: { backgroundColor: AppColors.primary },
  debtHeading: {
    color: AppColors.expense,
    fontSize: EntryComposerUi.sheetFieldFontSize,
    fontWeight: "600",
  },
  selectedText: { color: AppColors.inverseText },
  error: { ...SupportingTextStyle, color: AppColors.expense },
  action: {
    color: AppColors.primary,
    fontSize: EntryComposerUi.sheetFieldFontSize,
    fontWeight: "600",
  },
  delete: { color: AppColors.expense, fontSize: EntryComposerUi.sheetFieldFontSize },
  disabled: { opacity: EntryComposerUi.disabledOpacity },
});
