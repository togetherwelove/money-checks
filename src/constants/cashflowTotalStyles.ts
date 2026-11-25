import { StyleSheet } from "react-native";
import { createThemeValue } from "../lib/appTheme";
import { getAppColors } from "./colors";
import { AppLayout } from "./layout";
import { getSettingsGroupStyles, SettingsGroupDesign } from "./settingsGroupStyles";
import { AppFontSize } from "./typography";

export const getCashflowTotalStyles = createThemeValue(() =>
  StyleSheet.create({
    totalsCard: {
      backgroundColor: getAppColors().surfaceMuted,
      borderRadius: AppLayout.cardRadius,
      paddingHorizontal: AppLayout.cardContentPadding,
      paddingVertical: AppLayout.cardGap,
      gap: AppLayout.cardGap,
    },
    totalRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SettingsGroupDesign.contentGap,
    },
    totalColumn: { flex: 1, minWidth: 0, gap: SettingsGroupDesign.textGap },
    totalLabel: getSettingsGroupStyles().description,
    totalAmount: { fontSize: AppFontSize.label, fontWeight: "700", fontVariant: ["tabular-nums"] },
  }),
);
