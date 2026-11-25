import { AppFontSize } from "./typography";
import { createThemeValue } from "../lib/appTheme";
import { StyleSheet } from "react-native";
import { getAppColors } from "./colors";
import { AppLayout } from "./layout";

export const LedgerEntryRowUi = { iconSize: 16 } as const;

export const getLedgerEntryRowStyles = createThemeValue(() =>
  StyleSheet.create({
    row: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingHorizontal: AppLayout.screenPadding,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: getAppColors().border,
    },
    body: { flexDirection: "row", alignItems: "center", gap: 8 },
    leadingIcon: { width: 20, alignItems: "center" },
    textBlock: { flex: 1, gap: 2 },
    content: { color: getAppColors().text, fontSize: AppFontSize.body, fontWeight: "600" },
    amount: { flexShrink: 0, fontSize: AppFontSize.body, fontWeight: "700" },
    meta: { flexShrink: 1, color: getAppColors().mutedText, fontSize: AppFontSize.caption },
  }),
);
