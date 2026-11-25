import { SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import { AllEntriesCategoryGroup } from "./AllEntriesCategoryGroup";
import { AllEntriesPeriodFilter } from "./AllEntriesPeriodFilter";
import type { AllEntriesDateRange } from "../../constants/allEntries";
import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { NativeSelectionSheet } from "../NativeSelectionSheet";
import { AppScrollBehavior } from "../../constants/scroll";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  type AllEntriesEntryTypeFilter,
  AllEntriesEntryTypeFilters,
  AllEntriesFilterCopy,
  AllEntriesFilterUi,
  formatAllEntriesApplyLabel,
} from "../../constants/allEntries";
import { getAppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { countAllEntriesFilters } from "../../lib/allEntriesFilters";
import type { CategoryDefinition } from "../../types/category";

type AllEntriesFilterSheetProps = {
  dateRange?: AllEntriesDateRange | null;
  categories: readonly CategoryDefinition[];
  onApply: (
    entryTypeFilter: AllEntriesEntryTypeFilter,
    selectedCategoryIds: readonly string[],
    dateRange: AllEntriesDateRange | null,
  ) => void;
  onClose: () => void;
  selectedCategoryIds: readonly string[];
};

export function AllEntriesFilterSheet({
  dateRange = null,
  categories,
  onApply,
  onClose,
  selectedCategoryIds,
}: AllEntriesFilterSheetProps) {
  const [draftDateRange, setDraftDateRange] = useState(dateRange);
  const styles = getStyles();
  useAppTheme();
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>([...selectedCategoryIds]);
  const selectedCategoryIdSet = useMemo(() => new Set(draftCategoryIds), [draftCategoryIds]);
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "expense"),
    [categories],
  );
  const incomeCategories = useMemo(
    () => categories.filter((category) => category.type === "income"),
    [categories],
  );
  const filterCount = countAllEntriesFilters(
    AllEntriesEntryTypeFilters.all,
    draftCategoryIds,
    draftDateRange,
  );

  const toggleCategory = (categoryId: string) => {
    setDraftCategoryIds((currentCategoryIds) =>
      currentCategoryIds.includes(categoryId)
        ? currentCategoryIds.filter((currentCategoryId) => currentCategoryId !== categoryId)
        : [...currentCategoryIds, categoryId],
    );
  };

  const resetDraftFilters = () => {
    setDraftCategoryIds([]);
    setDraftDateRange(null);
  };

  return (
    <NativeSelectionSheet
      isOpen
      onClose={onClose}
      title={AllEntriesFilterCopy.sheetTitle}
      action={{
        label: formatAllEntriesApplyLabel(filterCount),
        onPress: () => {
          onApply(AllEntriesEntryTypeFilters.all, draftCategoryIds, draftDateRange);
          onClose();
        },
      }}
    >
      <ScrollView
        {...AppScrollBehavior}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AllEntriesPeriodFilter
          range={draftDateRange}
          onChange={setDraftDateRange}
          headingAction={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={AllEntriesFilterCopy.resetDraftAccessibilityLabel}
              onPress={resetDraftFilters}
              style={({ pressed }) => [styles.resetButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.resetLabel}>{AllEntriesFilterCopy.resetDraftLabel}</Text>
            </Pressable>
          }
        />
        <View style={styles.section}>
          {expenseCategories.length > 0 ? (
            <AllEntriesCategoryGroup
              categories={expenseCategories}
              onToggle={toggleCategory}
              selectedCategoryIdSet={selectedCategoryIdSet}
              title={AllEntriesFilterCopy.expenseCategorySectionLabel}
              type="expense"
            />
          ) : null}
          {incomeCategories.length > 0 ? (
            <AllEntriesCategoryGroup
              categories={incomeCategories}
              onToggle={toggleCategory}
              selectedCategoryIdSet={selectedCategoryIdSet}
              title={AllEntriesFilterCopy.incomeCategorySectionLabel}
              type="income"
            />
          ) : null}
        </View>
      </ScrollView>
    </NativeSelectionSheet>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    scroll: { flex: 1 },
    resetButton: {
      justifyContent: "center",
      minHeight: AllEntriesFilterUi.filterButtonMinimumHeight,
      flexShrink: 0,
    },
    resetLabel: {
      color: getAppColors().primary,
      fontSize: AllEntriesFilterUi.resetLabelFontSize,
      fontWeight: "700",
    },
    scrollContent: {
      gap: SettingsGroupDesign.sectionGap,
      paddingTop: AppLayout.cardGap,
      paddingBottom: AppLayout.cardContentPadding,
      paddingHorizontal: AppLayout.cardContentPadding,
    },
    section: {
      gap: SettingsGroupDesign.sectionGap,
    },
    pressed: {
      opacity: 0.7,
    },
  }),
);
