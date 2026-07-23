import { type MutableRefObject, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import {
  MonthlyInsightChartCopy,
  MonthlyInsightChartLayout,
} from "../constants/monthlyInsightCharts";
import { FullBleedHorizontalStyle } from "../constants/uiStyles";
import { useLedgerCategoryIconMap } from "../hooks/useLedgerCategoryIconMap";
import type { CategoryIconName } from "../types/category";
import type { MonthlyInsights } from "../types/ledger";
import { AppBannerAd } from "./AppBannerAd";
import { MonthlyBreakdownDonutChart } from "./monthlyInsights/MonthlyBreakdownDonutChart";
import { MonthlyComparisonSection } from "./monthlyInsights/MonthlyComparisonSection";
import { MonthlyTrendBarChart } from "./monthlyInsights/MonthlyTrendBarChart";

type MonthlyInsightsSectionProps = {
  activeBookId?: string | null;
  insights: MonthlyInsights;
  scope?: "all" | "periodic";
  showsBannerAd?: boolean;
};

type BreakdownMode = "category" | "member";
type BreakdownItem = {
  amount: number;
  iconName?: CategoryIconName;
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
const InitialBreakdownItemSignatures: Record<BreakdownFilterKey, string> = {
  expenseCategory: "",
  expenseMember: "",
  incomeCategory: "",
  incomeMember: "",
};
const DEFAULT_ACTIVE_BREAKDOWN_ITEM_LIMIT = 10;
const BREAKDOWN_ITEM_SIGNATURE_SEPARATOR = "|";
const BREAKDOWN_ITEM_SIGNATURE_VALUE_SEPARATOR = ":";

export function MonthlyInsightsSection({
  activeBookId = null,
  insights,
  scope = "periodic",
  showsBannerAd = false,
}: MonthlyInsightsSectionProps) {
  const categoryIconByKey = useLedgerCategoryIconMap(activeBookId);
  const [breakdownMode, setBreakdownMode] = useState<BreakdownMode>("category");
  const [incomeBreakdownMode, setIncomeBreakdownMode] = useState<BreakdownMode>("category");
  const [disabledItemKeysByChart, setDisabledItemKeysByChart] = useState<
    Record<BreakdownFilterKey, readonly string[]>
  >(InitialDisabledBreakdownItemKeys);
  const itemSignaturesByChartRef = useRef<Record<BreakdownFilterKey, string>>(
    InitialBreakdownItemSignatures,
  );
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
        iconName: categoryIconByKey.get(item.category),
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
        iconName: categoryIconByKey.get(item.category),
        key: item.category,
        label: item.category,
      }))
    : insights.memberIncomes.map((item) => ({
        amount: item.amount,
        key: item.memberName,
        label: item.memberName,
      }));
  const breakdownItemsSignature = buildBreakdownItemsSignature(breakdownItems);
  const incomeBreakdownItemsSignature = buildBreakdownItemsSignature(incomeBreakdownItems);
  const disabledBreakdownItemKeys = resolveCurrentDisabledBreakdownItemKeys({
    disabledItemKeys: disabledItemKeysByChart[breakdownFilterKey],
    filterKey: breakdownFilterKey,
    items: breakdownItems,
    itemSignaturesByChartRef,
    signature: breakdownItemsSignature,
  });
  const disabledIncomeBreakdownItemKeys = resolveCurrentDisabledBreakdownItemKeys({
    disabledItemKeys: disabledItemKeysByChart[incomeBreakdownFilterKey],
    filterKey: incomeBreakdownFilterKey,
    items: incomeBreakdownItems,
    itemSignaturesByChartRef,
    signature: incomeBreakdownItemsSignature,
  });

  useEffect(() => {
    setDisabledItemKeysByChart((currentValue) =>
      syncDefaultDisabledBreakdownItemKeys({
        currentValue,
        filterKey: breakdownFilterKey,
        items: breakdownItems,
        itemSignaturesByChartRef,
        signature: breakdownItemsSignature,
      }),
    );
  }, [breakdownFilterKey, breakdownItemsSignature]);

  useEffect(() => {
    setDisabledItemKeysByChart((currentValue) =>
      syncDefaultDisabledBreakdownItemKeys({
        currentValue,
        filterKey: incomeBreakdownFilterKey,
        items: incomeBreakdownItems,
        itemSignaturesByChartRef,
        signature: incomeBreakdownItemsSignature,
      }),
    );
  }, [incomeBreakdownFilterKey, incomeBreakdownItemsSignature]);
  const activeBreakdownItems = buildActiveBreakdownItems(
    breakdownItems,
    disabledBreakdownItemKeys,
  );
  const activeIncomeBreakdownItems = buildActiveBreakdownItems(
    incomeBreakdownItems,
    disabledIncomeBreakdownItemKeys,
  );
  const breakdownLegendItems = buildLegendItems(breakdownItems, activeBreakdownItems);
  const incomeBreakdownLegendItems = buildLegendItems(
    incomeBreakdownItems,
    activeIncomeBreakdownItems,
  );
  const separatesFirstBreakdown = scope === "periodic" || showsBannerAd;

  return (
    <View style={styles.section}>
      {showsBannerAd ? (
        <View style={styles.adPanel}>
          <AppBannerAd variant="embedded" />
        </View>
      ) : null}
      {scope === "periodic" ? (
        <MonthlyTrendBarChart
          title={
            insights.comparisonBasis === "period"
              ? MonthlyInsightChartCopy.periodTrendTitle
              : MonthlyInsightChartCopy.trendTitle
          }
          trendMonths={insights.trendMonths}
        />
      ) : null}
      {/* {scope === "periodic" ? <MonthlyComparisonSection insights={insights} /> : null} */}
      <View
        style={[
          styles.breakdownSection,
          separatesFirstBreakdown ? styles.separatedBreakdownSection : null,
        ]}
      >
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
      </View>
      <View style={[styles.breakdownSection, styles.separatedBreakdownSection]}>
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

function resolveCurrentDisabledBreakdownItemKeys({
  disabledItemKeys,
  filterKey,
  items,
  itemSignaturesByChartRef,
  signature,
}: {
  disabledItemKeys: readonly string[];
  filterKey: BreakdownFilterKey;
  items: BreakdownItem[];
  itemSignaturesByChartRef: MutableRefObject<Record<BreakdownFilterKey, string>>;
  signature: string;
}): readonly string[] {
  return itemSignaturesByChartRef.current[filterKey] === signature
    ? disabledItemKeys
    : buildDefaultDisabledBreakdownItemKeys(items);
}

function syncDefaultDisabledBreakdownItemKeys({
  currentValue,
  filterKey,
  items,
  itemSignaturesByChartRef,
  signature,
}: {
  currentValue: Record<BreakdownFilterKey, readonly string[]>;
  filterKey: BreakdownFilterKey;
  items: BreakdownItem[];
  itemSignaturesByChartRef: MutableRefObject<Record<BreakdownFilterKey, string>>;
  signature: string;
}): Record<BreakdownFilterKey, readonly string[]> {
  if (itemSignaturesByChartRef.current[filterKey] === signature) {
    return currentValue;
  }

  itemSignaturesByChartRef.current = {
    ...itemSignaturesByChartRef.current,
    [filterKey]: signature,
  };

  return {
    ...currentValue,
    [filterKey]: buildDefaultDisabledBreakdownItemKeys(items),
  };
}

function buildDefaultDisabledBreakdownItemKeys(items: BreakdownItem[]): string[] {
  return items.slice(DEFAULT_ACTIVE_BREAKDOWN_ITEM_LIMIT).map((item) => item.key);
}

function buildBreakdownItemsSignature(items: BreakdownItem[]): string {
  return items
    .map((item) =>
      [item.key, item.amount].join(BREAKDOWN_ITEM_SIGNATURE_VALUE_SEPARATOR),
    )
    .join(BREAKDOWN_ITEM_SIGNATURE_SEPARATOR);
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
    ...FullBleedHorizontalStyle,
    backgroundColor: AppColors.adBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  breakdownSection: {
    gap: 10,
  },
  separatedBreakdownSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
    paddingTop: AppLayout.cardGap,
  },
  segmentButton: {
    flex: 1,
    borderBottomWidth: MonthlyInsightChartLayout.segmentIndicatorHeight,
    borderBottomColor: AppColors.transparent,
    paddingVertical: 8,
    alignItems: "center",
  },
  segmentButtonSelected: {
    borderBottomColor: AppColors.primary,
  },
  segmentText: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  segmentTextSelected: {
    color: AppColors.primary,
  },
  segmentedControl: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
    flexDirection: "row",
  },
  section: {
    paddingTop: AppLayout.screenTopPadding,
    gap: AppLayout.cardGap,
  },
});
