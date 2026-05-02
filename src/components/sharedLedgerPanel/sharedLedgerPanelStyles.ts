import { StyleSheet } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { LedgerBookNicknameCopy } from "../../constants/ledgerBookNickname";
import { FormInputTextStyle } from "../../constants/uiStyles";

export const sharedLedgerPanelStyles = StyleSheet.create({
  panel: {
    gap: AppLayout.cardGap,
    paddingVertical: 4,
  },
  section: {
    gap: 8,
    padding: 14,
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  headerContent: {
    flex: 1,
    gap: 6,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  sectionLabel: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  bookName: {
    flexShrink: 1,
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  bookNameRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
  },
  bookNameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
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
    gap: 4,
    padding: 12,
    borderRadius: 14,
    backgroundColor: AppColors.surface,
  },
  shareCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
  },
  shareCode: {
    flexShrink: 1,
    color: AppColors.primary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  helpText: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 18,
  },
  hintText: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
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
  ledgerBookItemContent: {
    flex: 1,
    gap: 5,
  },
  ledgerBookItemName: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  activeBadge: {
    backgroundColor: AppColors.accentSoft,
  },
  activeBadgeText: {
    color: AppColors.accent,
  },
  createBookRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  createBookInput: {
    ...FormInputTextStyle,
    flex: 1,
  },
  leaveSection: {
    gap: 8,
    paddingTop: 4,
  },
  stateBadge: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sharedBadge: {
    backgroundColor: AppColors.incomeSoft,
  },
  stateBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  sharedBadgeText: {
    color: AppColors.income,
  },
});
