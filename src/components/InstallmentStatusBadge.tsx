import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { StyleSheet, Text, View } from "react-native";

import { getAppColors } from "../constants/colors";
import { InstallmentStatusBadgeUi, InstallmentStatuses } from "../constants/installments";
import { formatInstallmentProgressLabel } from "../lib/installments";
import type { LedgerEntry } from "../types/ledger";

export function InstallmentStatusBadge({ entry }: { entry: LedgerEntry }) {
  const styles = getStyles();
  useAppTheme();
  if (entry.installmentStatus !== InstallmentStatuses.prepaid) {
    return null;
  }

  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{formatInstallmentProgressLabel(entry)}</Text>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      borderColor: getAppColors().primary,
      borderRadius: InstallmentStatusBadgeUi.borderRadius,
      borderWidth: 1,
      paddingHorizontal: InstallmentStatusBadgeUi.horizontalPadding,
      paddingVertical: InstallmentStatusBadgeUi.verticalPadding,
    },
    label: {
      color: getAppColors().primary,
      fontSize: InstallmentStatusBadgeUi.fontSize,
      fontWeight: "700",
    },
  }),
);
