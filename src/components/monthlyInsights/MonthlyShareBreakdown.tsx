import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { OpenReportCategoryEntries } from "../../constants/allEntries";
import { AuthControls } from "../../constants/authControls";
import { getAppChartColors, getAppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import {
  MonthlyInsightChartCopy as Copy,
  MonthlyInsightChartLayout,
} from "../../constants/monthlyInsightCharts";
import { AppFontSize } from "../../constants/typography";
import { getSwitchAppearance } from "../../constants/switchAppearance";
import { SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import { getCardTitleTextStyle, getSupportingTextStyle } from "../../constants/uiStyles";
import { useAppTheme } from "../../hooks/useAppTheme";
import { createThemeValue } from "../../lib/appTheme";
import type {
  LedgerEntryType,
  MonthlyCategoryBreakdown,
  MonthlyMemberBreakdown,
} from "../../types/ledger";
import { formatCurrency } from "../../utils/calendar";
import { Feather } from "../AppIcons";

const shareFormatter = new Intl.NumberFormat("ko-KR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function MonthlyShareBreakdown({
  categories,
  members,
  entryType,
  onOpenCategories,
}: {
  categories: MonthlyCategoryBreakdown[];
  members: MonthlyMemberBreakdown[];
  entryType: LedgerEntryType;
  onOpenCategories?: OpenReportCategoryEntries;
}) {
  useAppTheme();
  const styles = getStyles();
  const [byMember, setByMember] = useState(entryType === "income");
  const chartColors = getAppChartColors();
  const title = entryType === "expense" ? Copy.expenseShareTitle : Copy.incomeShareTitle;
  const breakdown = byMember
    ? members.map((item) => ({
        key: `member-${item.memberKey}`,
        label: item.memberName,
        amount: item.amount,
        categoryId: "",
      }))
    : categories.map((item) => ({
        key: `category-${item.categoryId || item.category}`,
        label: item.category,
        amount: item.amount,
        categoryId: item.categoryId,
      }));
  const ranked = breakdown.filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
  const total = ranked.reduce((sum, item) => sum + item.amount, 0);
  const limit = MonthlyInsightChartLayout.shareItemLimit;
  const remaining = ranked.slice(limit);
  const otherAmount = remaining.reduce((sum, item) => sum + item.amount, 0);
  const items = ranked.slice(0, limit).map(({ key, label, amount, categoryId }, index) => ({
    key,
    label,
    amount,
    color: chartColors[index % chartColors.length],
    categories: categoryId ? [{ id: categoryId, label }] : [],
  }));
  if (otherAmount > 0) {
    items.push({
      key: "other",
      label: Copy.otherShare,
      amount: otherAmount,
      color: getAppColors().mutedStrongText,
      categories: remaining.every((item) => item.categoryId)
        ? remaining.map(({ categoryId, label }) => ({ id: categoryId, label }))
        : [],
    });
  }
  const rows = items.map(({ categories, ...item }) => ({
    ...item,
    onPress:
      onOpenCategories && categories.length
        ? () => onOpenCategories(categories, entryType)
        : undefined,
  }));

  return (
    <View style={styles.section}>
      <View style={styles.rowHeading}>
        <Text accessibilityRole="header" style={styles.heading}>
          {title}
        </Text>
        <View style={styles.toggleLabel}>
          <Text style={styles.details}>{Copy.shareByMember}</Text>
          <Switch
            accessibilityLabel={`${title}, ${Copy.shareByMember}`}
            {...getSwitchAppearance()}
            value={byMember}
            onValueChange={setByMember}
          />
        </View>
      </View>
      {items.length ? (
        <>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.track}
          >
            {rows.map(({ key, amount, color, onPress }) => (
              <Pressable
                key={key}
                disabled={!onPress}
                onPress={onPress}
                style={{
                  flex: amount / total,
                  backgroundColor: color,
                  borderRadius: AppLayout.dividerWidth * 2,
                }}
              />
            ))}
          </View>
          <View style={styles.legend}>
            {rows.map(({ key, label, amount, color, onPress }) => {
              const Row = onPress ? Pressable : View;
              return (
                <Row
                  key={key}
                  accessibilityRole={onPress ? "button" : undefined}
                  onPress={onPress}
                  style={styles.rowHeading}
                >
                  <View style={styles.legendLabel}>
                    <View style={[styles.dot, { backgroundColor: color }]} />
                    <Text style={styles.label}>{label}</Text>
                  </View>
                  <Text style={styles.details}>
                    {`${formatCurrency(amount)} · ${shareFormatter.format(amount / total)}`}
                  </Text>
                  {onPress ? (
                    <Feather
                      name="chevron-right"
                      size={SettingsGroupDesign.iconSize}
                      color={getAppColors().mutedStrongText}
                    />
                  ) : null}
                </Row>
              );
            })}
          </View>
        </>
      ) : (
        <Text style={getSupportingTextStyle()}>
          {entryType === "expense" ? Copy.noExpenseShare : Copy.noIncomeShare}
        </Text>
      )}
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    section: { gap: AppLayout.cardContentPadding },
    heading: getCardTitleTextStyle(),
    toggleLabel: { flexDirection: "row", alignItems: "center", gap: AppLayout.compactGap },
    legend: { gap: AppLayout.compactGap },
    legendLabel: {
      flex: 1,
      flexShrink: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: AppLayout.compactGap,
    },
    dot: {
      width: AppLayout.listItemGap,
      height: AppLayout.listItemGap,
      borderRadius: AppLayout.groupRadius,
    },
    rowHeading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: AppLayout.cardGap,
      minHeight: AuthControls.controlHeight,
    },
    label: {
      flexShrink: 1,
      color: getAppColors().text,
      fontSize: AppFontSize.label,
      fontWeight: "600",
    },
    details: {
      flexShrink: 1,
      textAlign: "right",
      color: getAppColors().mutedText,
      fontSize: AppFontSize.body,
      fontVariant: ["tabular-nums"],
    },
    track: {
      flexDirection: "row",
      gap: AppLayout.dividerWidth * 2,
      height: AppLayout.cardContentPadding,
    },
  }),
);
