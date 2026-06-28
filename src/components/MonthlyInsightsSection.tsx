import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { MonthlyInsightChartCopy } from "../constants/monthlyInsightCharts";
import type { MonthlyInsights } from "../types/ledger";
import { AppBannerAd } from "./AppBannerAd";
import { MonthlyBreakdownDonutChart } from "./monthlyInsights/MonthlyBreakdownDonutChart";
import { MonthlyComparisonSection } from "./monthlyInsights/MonthlyComparisonSection";
import { MonthlyTrendBarChart } from "./monthlyInsights/MonthlyTrendBarChart";

type MonthlyInsightsSectionProps = {
  insights: MonthlyInsights;
  showsBannerAd?: boolean;
};

type BreakdownMode = "category" | "member";
type BreakdownItem = {
  amount: number;
  key: string;
  label: string;
};
type BreakdownFilterKey = "expenseCategory" | "expenseMember" | "incomeCategory" | "incomeMember";

const BreakdownFilterKeys = {
  expenseCategory: "expenseCategory",
  expenseMember: "expenseMember",
  incomeCategory: "incomeCategory",
  incomeMember: "incomeMember",
} as const satisfies Record<BreakdownFilterKey, BreakdownFilterKey>;

const InitialDisabledBreakdownItemKeys = {
  expenseCategory: [],
  expenseMember: [],
  incomeCategory: [],
  incomeMember: [],
} as const satisfies Record<BreakdownFilterKey, readonly string[]>;

export function MonthlyInsightsSection({
  insights,
  showsBannerAd = false,
}: MonthlyInsightsSectionProps) {
  const [breakdownMode, setBreakdownMode] = useState<BreakdownMode>("category");
  const [incomeBreakdownMode, setIncomeBreakdownMode] = useState<BreakdownMode>("category");
  const [disabledItemKeysByChart, setDisabledItemKeysByChart] = useState<
    Record<BreakdownFilterKey, readonly string[]>
  >(InitialDisabledBreakdownItemKeys);
  const isCategoryMode = breakdownMode === "category";
  const isIncomeCategoryMode = incomeBreakdownMode === "category";
  const breakdownFilterKey = isCategoryMode
    ? BreakdownFilterKeys.expenseCategory
    : BreakdownFilterKeys.expenseMember;
  const incomeBreakdownFilterKey = isIncomeCategoryMode
    ? BreakdownFilterKeys.incomeCategory
    : BreakdownFilterKeys.incomeMember;
  const breakdownItems = isCategoryMode
    ? insights.categoryExpenses.map((item) => ({
        amount: item.amount,
        key: item.category,
        label: item.category,
      }))
    : insights.memberExpenses.map((item) => ({
        amount: item.amount,
        key: item.memberName,
        label: item.memberName,
      }));
  const incomeBreakdownItems = isIncomeCategoryMode
    ? insights.categoryIncomes.map((item) => ({
        amount: item.amount,
        key: item.category,
        label: item.category,
      }))
    : insights.memberIncomes.map((item) => ({
        amount: item.amount,
        key: item.memberName,
        label: item.memberName,
      }));
  const activeBreakdownItems = buildActiveBreakdownItems(
    breakdownItems,
    disabledItemKeysByChart[breakdownFilterKey],
  );
  const activeIncomeBreakdownItems = buildActiveBreakdownItems(
    incomeBreakdownItems,
    disabledItemKeysByChart[incomeBreakdownFilterKey],
  );
  const breakdownLegendItems = buildLegendItems(breakdownItems, activeBreakdownItems);
  const incomeBreakdownLegendItems = buildLegendItems(
    incomeBreakdownItems,
    activeIncomeBreakdownItems,
  );

  return (
    <View style={styles.section}>
      <MonthlyComparisonSection insights={insights} />
      <MonthlyTrendBarChart trendMonths={insights.trendMonths} />
      {showsBannerAd ? (
        <View style={styles.adPanel}>
          <AppBannerAd variant="embedded" />
        </View>
      ) : null}
      <View style={styles.breakdownSection}>
        <MonthlyBreakdownDonutChart
          centerLabel={MonthlyInsightChartCopy.totalExpenseLabel}
          emptyMessage={
            breakdownItems.length
              ? MonthlyInsightChartCopy.filteredEmpty
              : isCategoryMode
                ? MonthlyInsightChartCopy.categoryEmpty
                : MonthlyInsightChartCopy.memberEmpty
          }
          items={activeBreakdownItems}
          legendItems={breakdownLegendItems}
          onToggleItem={(itemKey) => toggleBreakdownItem(breakdownFilterKey, itemKey)}
          title={
            isCategoryMode
              ? MonthlyInsightChartCopy.categoryTitle
              : MonthlyInsightChartCopy.memberTitle
          }
        />
        <View style={styles.segmentedControl}>
          <SegmentButton
            isSelected={isCategoryMode}
            label={MonthlyInsightChartCopy.breakdownCategoryLabel}
            onPress={() => setBreakdownMode("category")}
          />
          <SegmentButton
            isSelected={!isCategoryMode}
            label={MonthlyInsightChartCopy.breakdownMemberLabel}
            onPress={() => setBreakdownMode("member")}
          />
        </View>
      </View>
      <View style={styles.breakdownSection}>
        <MonthlyBreakdownDonutChart
          centerLabel={MonthlyInsightChartCopy.totalIncomeLabel}
          emptyMessage={
            incomeBreakdownItems.length
              ? MonthlyInsightChartCopy.filteredEmpty
              : isIncomeCategoryMode
                ? MonthlyInsightChartCopy.incomeCategoryEmpty
                : MonthlyInsightChartCopy.incomeMemberEmpty
          }
          items={activeIncomeBreakdownItems}
          legendItems={incomeBreakdownLegendItems}
          onToggleItem={(itemKey) => toggleBreakdownItem(incomeBreakdownFilterKey, itemKey)}
          title={
            isIncomeCategoryMode
              ? MonthlyInsightChartCopy.incomeCategoryTitle
              : MonthlyInsightChartCopy.incomeMemberTitle
          }
        />
        <View style={styles.segmentedControl}>
          <SegmentButton
            isSelected={isIncomeCategoryMode}
            label={MonthlyInsightChartCopy.breakdownCategoryLabel}
            onPress={() => setIncomeBreakdownMode("category")}
          />
          <SegmentButton
            isSelected={!isIncomeCategoryMode}
            label={MonthlyInsightChartCopy.breakdownMemberLabel}
            onPress={() => setIncomeBreakdownMode("member")}
          />
        </View>
      </View>
    </View>
  );

  function toggleBreakdownItem(filterKey: BreakdownFilterKey, itemKey: string) {
    setDisabledItemKeysByChart((currentValue) => {
      const disabledKeys = currentValue[filterKey];
      const nextDisabledKeys = disabledKeys.includes(itemKey)
        ? disabledKeys.filter((disabledKey) => disabledKey !== itemKey)
        : [...disabledKeys, itemKey];

      return {
        ...currentValue,
        [filterKey]: nextDisabledKeys,
      };
    });
  }
}

function buildActiveBreakdownItems(
  items: BreakdownItem[],
  disabledItemKeys: readonly string[],
): Array<BreakdownItem & { share: number }> {
  const activeItems = items.filter((item) => !disabledItemKeys.includes(item.key));
  const totalAmount = activeItems.reduce((sum, item) => sum + item.amount, 0);

  if (totalAmount <= 0) {
    return activeItems.map((item) => ({ ...item, share: 0 }));
  }

  return activeItems.map((item) => ({
    ...item,
    share: item.amount / totalAmount,
  }));
}

function buildLegendItems(
  items: BreakdownItem[],
  activeItems: Array<BreakdownItem & { share: number }>,
) {
  const activeItemByKey = new Map(activeItems.map((item) => [item.key, item]));

  return items.map((item) => {
    const activeItem = activeItemByKey.get(item.key);

    return {
      ...item,
      isActive: Boolean(activeItem),
      share: activeItem?.share ?? 0,
    };
  });
}

function SegmentButton({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={[styles.segmentButton, isSelected ? styles.segmentButtonSelected : null]}
    >
      <Text style={[styles.segmentText, isSelected ? styles.segmentTextSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  adPanel: {
    backgroundColor: AppColors.surfaceMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  breakdownSection: {
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  segmentButtonSelected: {
    backgroundColor: AppColors.primary,
  },
  segmentText: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  segmentTextSelected: {
    color: AppColors.inverseText,
  },
  segmentedControl: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 10,
    backgroundColor: AppColors.surfaceMuted,
    padding: 3,
    flexDirection: "row",
  },
  section: {
    paddingTop: AppLayout.screenTopPadding,
    gap: AppLayout.cardGap,
  },
});
