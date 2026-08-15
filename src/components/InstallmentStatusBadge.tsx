import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import {
  InstallmentStatusBadgeUi,
  InstallmentStatuses,
} from "../constants/installments";
import { formatInstallmentProgressLabel } from "../lib/installments";
import type { LedgerEntry } from "../types/ledger";

export function InstallmentStatusBadge({ entry }: { entry: LedgerEntry }) {
  if (entry.installmentStatus !== InstallmentStatuses.prepaid) {
    return null;
  }

  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{formatInstallmentProgressLabel(entry)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderColor: AppColors.primary,
    borderRadius: InstallmentStatusBadgeUi.borderRadius,
    borderWidth: 1,
    paddingHorizontal: InstallmentStatusBadgeUi.horizontalPadding,
    paddingVertical: InstallmentStatusBadgeUi.verticalPadding,
  },
  label: {
    color: AppColors.primary,
    fontSize: InstallmentStatusBadgeUi.fontSize,
    fontWeight: "700",
  },
});
