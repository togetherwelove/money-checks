import { StyleSheet } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";

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
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
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
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
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
    gap: 2,
  },
  shareCode: {
    flex: 1,
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
  leaveSection: {
    gap: 8,
    paddingTop: 4,
  },
  stateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  personalBadge: {
    backgroundColor: AppColors.accentSoft,
  },
  sharedBadge: {
    backgroundColor: AppColors.incomeSoft,
  },
  stateBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  personalBadgeText: {
    color: AppColors.accent,
  },
  sharedBadgeText: {
    color: AppColors.income,
  },
});
