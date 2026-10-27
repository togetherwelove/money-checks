import { NativeSelectionSheet } from "../NativeSelectionSheet";
import { AppScrollBehavior } from "../../constants/scroll";
import { Feather } from "../AppIcons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  type AllEntriesEntryTypeFilter,
  AllEntriesEntryTypeFilterOptions,
  AllEntriesEntryTypeFilters,
  AllEntriesFilterCopy,
  AllEntriesFilterUi,
  formatAllEntriesApplyLabel,
} from "../../constants/allEntries";
import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import {
  countAllEntriesFilters,
  filterCategoriesByEntryType,
  pruneCategoryIdsForEntryType,
} from "../../lib/allEntriesFilters";
import type { CategoryDefinition } from "../../types/category";
import type { LedgerEntryType } from "../../types/ledger";

type AllEntriesFilterSheetProps = {
  categories: readonly CategoryDefinition[];
  entryTypeFilter: AllEntriesEntryTypeFilter;
  onApply: (
    entryTypeFilter: AllEntriesEntryTypeFilter,
    selectedCategoryIds: readonly string[],
  ) => void;
  onClose: () => void;
  selectedCategoryIds: readonly string[];
};

export function AllEntriesFilterSheet({
  categories,
  entryTypeFilter,
  onApply,
  onClose,
  selectedCategoryIds,
}: AllEntriesFilterSheetProps) {
  const [draftEntryTypeFilter, setDraftEntryTypeFilter] =
    useState<AllEntriesEntryTypeFilter>(entryTypeFilter);
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>([...selectedCategoryIds]);
  const selectedCategoryIdSet = useMemo(() => new Set(draftCategoryIds), [draftCategoryIds]);
  const visibleCategories = useMemo(
    () => filterCategoriesByEntryType(categories, draftEntryTypeFilter),
    [categories, draftEntryTypeFilter],
  );
  const expenseCategories = useMemo(
    () => visibleCategories.filter((category) => category.type === "expense"),
    [visibleCategories],
  );
  const incomeCategories = useMemo(
    () => visibleCategories.filter((category) => category.type === "income"),
    [visibleCategories],
  );
  const filterCount = countAllEntriesFilters(draftEntryTypeFilter, draftCategoryIds);

  const changeEntryTypeFilter = (nextEntryTypeFilter: AllEntriesEntryTypeFilter) => {
    setDraftEntryTypeFilter(nextEntryTypeFilter);
    setDraftCategoryIds((currentCategoryIds) =>
      pruneCategoryIdsForEntryType(categories, currentCategoryIds, nextEntryTypeFilter),
    );
  };

  const toggleCategory = (categoryId: string) => {
    setDraftCategoryIds((currentCategoryIds) =>
      currentCategoryIds.includes(categoryId)
        ? currentCategoryIds.filter((currentCategoryId) => currentCategoryId !== categoryId)
        : [...currentCategoryIds, categoryId],
    );
  };

  const resetDraftFilters = () => {
    setDraftEntryTypeFilter(AllEntriesEntryTypeFilters.all);
    setDraftCategoryIds([]);
  };

  return (
    <NativeSelectionSheet
      isOpen
      onClose={onClose}
      title={AllEntriesFilterCopy.sheetTitle}
      action={{
        label: formatAllEntriesApplyLabel(filterCount),
        onPress: () => {
          onApply(draftEntryTypeFilter, draftCategoryIds);
          onClose();
        },
      }}
    >
      <View style={styles.typeFilterRow}>
        <View style={styles.typeOptions}>
          {AllEntriesEntryTypeFilterOptions.map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: draftEntryTypeFilter === option.value }}
              key={option.value}
              onPress={() => changeEntryTypeFilter(option.value)}
              style={[
                styles.typeOption,
                draftEntryTypeFilter === option.value ? styles.selectedOption : null,
              ]}
            >
              <Text
                style={[
                  styles.typeOptionLabel,
                  draftEntryTypeFilter === option.value ? styles.selectedOptionLabel : null,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={AllEntriesFilterCopy.resetLabel}
          onPress={resetDraftFilters}
          style={({ pressed }) => [styles.resetButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.resetLabel}>{AllEntriesFilterCopy.resetLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        {...AppScrollBehavior}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          {expenseCategories.length > 0 ? (
            <CategoryGroup
              categories={expenseCategories}
              onToggle={toggleCategory}
              selectedCategoryIdSet={selectedCategoryIdSet}
              title={AllEntriesFilterCopy.expenseCategorySectionLabel}
              type="expense"
            />
          ) : null}
          {incomeCategories.length > 0 ? (
            <CategoryGroup
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

function CategoryGroup({
  categories,
  onToggle,
  selectedCategoryIdSet,
  title,
  type,
}: {
  categories: readonly CategoryDefinition[];
  onToggle: (categoryId: string) => void;
  selectedCategoryIdSet: ReadonlySet<string>;
  title: string;
  type: LedgerEntryType;
}) {
  return (
    <View style={styles.categoryGroup}>
      <Text accessibilityRole="header" style={styles.categoryGroupTitle}>
        {title}
      </Text>
      <View style={styles.categoryGrid}>
        {categories.map((category) => {
          const selected = selectedCategoryIdSet.has(category.id);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={category.id}
              onPress={() => onToggle(category.id)}
              style={[styles.categoryChip, selected ? styles.selectedOption : null]}
            >
              <Feather
                color={selected ? AppColors.inverseText : resolveCategoryColor(type)}
                name={category.iconName}
                size={AllEntriesFilterUi.categoryIconSize}
              />
              <Text
                numberOfLines={1}
                style={[styles.categoryChipLabel, selected ? styles.selectedOptionLabel : null]}
              >
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function resolveCategoryColor(type: LedgerEntryType): string {
  return type === "income" ? AppColors.income : AppColors.expense;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  typeFilterRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: AppLayout.cardGap,
    paddingTop: AppLayout.cardGap,
    paddingHorizontal: AppLayout.cardContentPadding,
    flexShrink: 0,
  },
  resetButton: {
    justifyContent: "center",
    minHeight: AllEntriesFilterUi.filterButtonMinimumHeight,
    flexShrink: 0,
  },
  resetLabel: {
    color: AppColors.primary,
    fontSize: AllEntriesFilterUi.resetLabelFontSize,
    fontWeight: "700",
  },
  scrollContent: {
    gap: AppLayout.cardContentPadding,
    paddingTop: AppLayout.cardGap,
    paddingBottom: AppLayout.cardContentPadding,
    paddingHorizontal: AppLayout.cardContentPadding,
  },
  section: {
    gap: AppLayout.cardGap,
  },
  typeOptions: {
    backgroundColor: AppColors.surfaceStrong,
    borderRadius: AllEntriesFilterUi.categoryChipRadius,
    flexDirection: "row",
    flex: 1,
    minWidth: 0,
    padding: AppLayout.compactGap,
  },
  typeOption: {
    alignItems: "center",
    borderRadius: AllEntriesFilterUi.categoryChipRadius,
    flex: 1,
    justifyContent: "center",
    minHeight: AllEntriesFilterUi.typeOptionMinimumHeight,
  },
  typeOptionLabel: {
    color: AppColors.mutedText,
    fontSize: AllEntriesFilterUi.typeOptionFontSize,
    fontWeight: "700",
  },
  selectedOption: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  selectedOptionLabel: {
    color: AppColors.inverseText,
  },
  categoryGroup: {
    gap: AppLayout.compactGap,
  },
  categoryGroupTitle: {
    color: AppColors.mutedStrongText,
    fontSize: AllEntriesFilterUi.sectionLabelFontSize,
    fontWeight: "700",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppLayout.compactGap,
  },
  categoryChip: {
    alignItems: "center",
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderRadius: AllEntriesFilterUi.categoryChipRadius,
    borderWidth: 1,
    flexDirection: "row",
    gap: AppLayout.compactGap,
    maxWidth: "100%",
    minHeight: AllEntriesFilterUi.categoryChipMinimumHeight,
    paddingHorizontal: AllEntriesFilterUi.categoryChipHorizontalPadding,
  },
  categoryChipLabel: {
    color: AppColors.text,
    flexShrink: 1,
    fontSize: AllEntriesFilterUi.categoryLabelFontSize,
    fontWeight: "700",
    maxWidth: "100%",
  },
  pressed: {
    opacity: 0.7,
  },
});
