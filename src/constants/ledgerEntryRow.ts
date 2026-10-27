import { StyleSheet } from "react-native";
import { AppColors } from "./colors";
import { AppLayout } from "./layout";

export const LedgerEntryRowUi = { iconSize: 16 } as const;

export const LedgerEntryRowStyles = StyleSheet.create({
  row: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: AppLayout.screenPadding,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  body: { flexDirection: "row", alignItems: "center", gap: 8 },
  leadingIcon: { width: 20, alignItems: "center" },
  textBlock: { flex: 1, gap: 2 },
  content: { color: AppColors.text, fontSize: 14, fontWeight: "600" },
  amount: { flexShrink: 0, fontSize: 13, fontWeight: "700" },
  meta: { flexShrink: 1, color: AppColors.mutedText, fontSize: 12 },
});
