import { Feather } from "@expo/vector-icons";
import { type ReactNode, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { ActionButton } from "../ActionButton";

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
  const safeAreaInsets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [draftEntryTypeFilter, setDraftEntryTypeFilter] =
    useState<AllEntriesEntryTypeFilter>(entryTypeFilter);
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>([
    ...selectedCategoryIds,
  ]);
  const selectedCategoryIdSet = useMemo(
    () => new Set(draftCategoryIds),
    [draftCategoryIds],
  );
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
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel={AllEntriesFilterCopy.closeAccessibilityLabel}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.sheet,
            { maxHeight: windowHeight * AllEntriesFilterUi.filterSheetMaximumHeightRatio },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.headerTitle}>
              {AllEntriesFilterCopy.sheetTitle}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={resetDraftFilters}
              style={({ pressed }) => [styles.resetButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.resetLabel}>{AllEntriesFilterCopy.resetLabel}</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <FilterSection title={AllEntriesFilterCopy.entryTypeSectionLabel}>
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
                        draftEntryTypeFilter === option.value
                          ? styles.selectedOptionLabel
                          : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </FilterSection>

            <FilterSection title={AllEntriesFilterCopy.categorySectionLabel}>
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
            </FilterSection>
          </ScrollView>

          <View
            style={[
              styles.actionRow,
              { paddingBottom: Math.max(safeAreaInsets.bottom, AppLayout.cardGap) },
            ]}
          >
            <ActionButton
              fullWidth
              label={AllEntriesFilterCopy.cancelLabel}
              onPress={onClose}
              size="large"
            />
            <ActionButton
              fullWidth
              label={formatAllEntriesApplyLabel(filterCount)}
              onPress={() => {
                onApply(draftEntryTypeFilter, draftCategoryIds);
                onClose();
              }}
              size="large"
              variant="primary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
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
      <Text style={styles.categoryGroupTitle}>{title}</Text>
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
                style={[
                  styles.categoryChipLabel,
                  selected ? styles.selectedOptionLabel : null,
                ]}
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
  overlay: {
    backgroundColor: AppColors.overlay,
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: AllEntriesFilterUi.filterSheetTopRadius,
    borderTopRightRadius: AllEntriesFilterUi.filterSheetTopRadius,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: AppColors.border,
    borderRadius: AllEntriesFilterUi.sheetHandleHeight / 2,
    height: AllEntriesFilterUi.sheetHandleHeight,
    marginTop: AppLayout.cardGap,
    width: AllEntriesFilterUi.sheetHandleWidth,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: AppLayout.cardContentPadding,
    paddingVertical: AppLayout.cardGap,
  },
  headerTitle: {
    color: AppColors.text,
    fontSize: AllEntriesFilterUi.headerTitleFontSize,
    fontWeight: "800",
  },
  resetButton: {
    justifyContent: "center",
    minHeight: AllEntriesFilterUi.activeFilterChipHeight,
  },
  resetLabel: {
    color: AppColors.primary,
    fontSize: AllEntriesFilterUi.resetLabelFontSize,
    fontWeight: "700",
  },
  scrollContent: {
    gap: AppLayout.cardContentPadding,
    paddingBottom: AppLayout.cardContentPadding,
    paddingHorizontal: AppLayout.cardContentPadding,
  },
  section: {
    gap: AppLayout.cardGap,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: AllEntriesFilterUi.sectionLabelFontSize,
    fontWeight: "800",
  },
  typeOptions: {
    backgroundColor: AppColors.surfaceStrong,
    borderRadius: AllEntriesFilterUi.categoryChipRadius,
    flexDirection: "row",
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
  actionRow: {
    borderTopColor: AppColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: AppLayout.cardGap,
    paddingHorizontal: AppLayout.cardContentPadding,
    paddingTop: AppLayout.cardGap,
  },
  pressed: {
    opacity: 0.7,
  },
});
