import { StyleSheet, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import { SummaryCard } from "./SummaryCard";

type MonthlySummaryProps = {
  totalExpense: string;
  totalIncome: string;
};

export function MonthlySummary({ totalExpense, totalIncome }: MonthlySummaryProps) {
  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <SummaryCard title={AppMessages.summaryIncome} value={`+ ${totalIncome}`} tone="income" />
      </View>
      <View style={[styles.item, styles.trailingItem]}>
        <SummaryCard
          title={AppMessages.summaryExpense}
          value={`- ${totalExpense}`}
          tone="expense"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: AppColors.surface,
  },
  item: {
    flex: 1,
  },
  trailingItem: {
    borderLeftWidth: 1,
    borderLeftColor: AppColors.border,
  },
});
