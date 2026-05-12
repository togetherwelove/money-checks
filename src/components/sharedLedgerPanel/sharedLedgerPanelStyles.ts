import { StyleSheet } from "react-native";

import { AuthControls } from "../../constants/authControls";
import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { LedgerBookNicknameCopy } from "../../constants/ledgerBookNickname";
import { SharedLedgerPanelUi } from "../../constants/sharedLedgerPanel";
import { FormInputTextStyle } from "../../constants/uiStyles";

export const sharedLedgerPanelStyles = StyleSheet.create({
  panel: {
    gap: AppLayout.cardGap,
  },
  section: {
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: AppLayout.cardRadius,
    backgroundColor: AppColors.surface,
  },
  primarySection: {
    backgroundColor: AppColors.surfaceMuted,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: AuthControls.inlineControlHeight,
    paddingHorizontal: AppLayout.cardContentPadding,
    paddingTop: AppLayout.cardContentPadding,
  },
  sectionContent: {
    paddingHorizontal: AppLayout.cardContentPadding,
  },
  sectionContentInset: {
    gap: 8,
    paddingHorizontal: AppLayout.cardContentPadding,
    paddingVertical: AppLayout.cardContentPadding,
  },
  sectionBottomInset: {
    paddingBottom: AppLayout.cardContentPadding,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: SharedLedgerPanelUi.sectionTitleFontSize,
    fontWeight: "800",
    includeFontPadding: false,
    lineHeight: SharedLedgerPanelUi.sectionTitleLineHeight,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
    height: AuthControls.inlineControlHeight,
  },
  bookName: {
    flexShrink: 1,
    color: AppColors.text,
    fontSize: SharedLedgerPanelUi.sectionTitleFontSize,
    fontWeight: "800",
  },
  bookNameHeaderTitle: {
    flex: 1,
  },
  bookNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  bookNameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    flex: 1,
    gap: 8,
  },
  bookNameHeaderInput: {
    ...FormInputTextStyle,
    flex: 1,
  },
  bookNameActionSlot: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  bookNameCancelAction: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  codeBlock: {
    gap: 8,
    paddingHorizontal: AppLayout.cardContentPadding,
  },
  shareCodePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  shareCodePreviewValue: {
    color: AppColors.mutedStrongText,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  shareCodeRow: {
    flexDirection: "row",
  },
  copyActionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SharedLedgerPanelUi.copyActionGap,
  },
  copyActionText: {
    color: AppColors.inverseText,
    fontSize: SharedLedgerPanelUi.copyActionTextFontSize,
    fontWeight: "700",
  },
  helpText: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 18,
  },
  hintText: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    includeFontPadding: false,
    lineHeight: 16,
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    backgroundColor: AppColors.background,
    color: AppColors.text,
    fontSize: 16,
    textTransform: "uppercase",
  },
  disabledInput: {
    opacity: 0.55,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  successText: {
    color: AppColors.income,
  },
  errorText: {
    color: AppColors.expense,
  },
  actionRow: {
    paddingTop: 2,
  },
  ledgerBookList: {
    gap: 6,
    paddingHorizontal: AppLayout.cardContentPadding,
  },
  ledgerBookMembersBlock: {
    paddingTop: SharedLedgerPanelUi.ledgerBookMembersBlockTopPadding,
  },
  ledgerBookItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    backgroundColor: AppColors.background,
  },
  activeLedgerBookItem: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceMuted,
  },
  readOnlyLedgerBookItem: {
    backgroundColor: AppColors.surfaceMuted,
    opacity: 0.78,
  },
  ledgerBookItemContent: {
    flex: 1,
    gap: 5,
  },
  ledgerBookItemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ledgerBookItemName: {
    flexShrink: 1,
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  readOnlyLedgerBookChip: {
    borderRadius: 999,
    backgroundColor: AppColors.surfaceStrong,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  readOnlyLedgerBookChipText: {
    color: AppColors.expense,
    fontSize: 10,
    fontWeight: "800",
  },
  ledgerBookItemMeta: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "600",
  },
  ledgerBookItemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  pendingRequestBadge: {
    width: SharedLedgerPanelUi.pendingRequestBadgeSize,
    height: SharedLedgerPanelUi.pendingRequestBadgeSize,
    borderRadius: SharedLedgerPanelUi.pendingRequestBadgeSize / 2,
    backgroundColor: AppColors.expense,
  },
  createBookRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: AppLayout.cardContentPadding,
  },
  createBookInput: {
    ...FormInputTextStyle,
    flex: 1,
  },
  disconnectActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: AppLayout.cardContentPadding,
    paddingTop: 2,
  },
  subsection: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    paddingTop: AppLayout.cardContentPadding,
  },
});
