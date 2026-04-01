import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";

type SummaryCardProps = {
  title: string;
  value: string;
  tone: "primary" | "income" | "expense";
};

const cardToneStyles = {
  primary: {
    valueColor: AppColors.primary,
  },
  income: {
    valueColor: AppColors.income,
  },
  expense: {
    valueColor: AppColors.expense,
  },
} as const;

export function SummaryCard({ title, value, tone }: SummaryCardProps) {
  const toneStyle = cardToneStyles[tone];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: toneStyle.valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: AppLayout.summaryCardMinWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
    backgroundColor: "transparent",
  },
  title: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    fontWeight: "800",
  },
});
