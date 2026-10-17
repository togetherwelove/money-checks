import { AppScrollBehavior } from "../../constants/scroll";
import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

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
import { useFilterSheetAnimation } from "../../hooks/useFilterSheetAnimation";
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
  const sheetAnimation = useFilterSheetAnimation(onClose, windowHeight);
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
      animationType="none"
      onShow={sheetAnimation.open}
      onRequestClose={() => sheetAnimation.close()}
      statusBarTranslucent
      transparent
      visible
    >
      <GestureHandlerRootView style={styles.overlay}>
        <Pressable
          accessibilityLabel={AllEntriesFilterCopy.closeAccessibilityLabel}
          accessibilityRole="button"
          disabled={sheetAnimation.isClosing}
          onPress={() => sheetAnimation.close()}
          style={StyleSheet.absoluteFill}
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.backdrop, sheetAnimation.backdropStyle]}
          />
        </Pressable>
        <Animated.View
          pointerEvents={sheetAnimation.isClosing ? "none" : "auto"}
          style={[
            styles.sheet,
            sheetAnimation.sheetStyle,
            { maxHeight: windowHeight * AllEntriesFilterUi.filterSheetMaximumHeightRatio },
          ]}
        >
          <GestureDetector gesture={sheetAnimation.handleGesture}>
            <View
              accessible
              accessibilityRole="button"
              accessibilityLabel={AllEntriesFilterCopy.closeAccessibilityLabel}
              onAccessibilityTap={() => sheetAnimation.close()}
              style={styles.handleTouchArea}
            >
              <View style={styles.handle} />
            </View>
          </GestureDetector>
          <ScrollView {...AppScrollBehavior}            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
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
              <Pressable
                accessibilityRole="button"
                onPress={resetDraftFilters}
                style={({ pressed }) => [styles.resetButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.resetLabel}>{AllEntriesFilterCopy.resetLabel}</Text>
              </Pressable>
            </View>

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

          <View
            style={[
              styles.actionRow,
              { paddingBottom: Math.max(safeAreaInsets.bottom, AppLayout.cardGap) },
            ]}
          >
            <ActionButton
              fullWidth
              label={AllEntriesFilterCopy.cancelLabel}
              onPress={() => sheetAnimation.close()}
              size="large"
            />
            <ActionButton
              fullWidth
              label={formatAllEntriesApplyLabel(filterCount)}
              onPress={() => {
                sheetAnimation.close(() => onApply(draftEntryTypeFilter, draftCategoryIds));
              }}
              size="large"
              variant="primary"
            />
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
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
      <Text accessibilityRole="header" style={styles.categoryGroupTitle}>{title}</Text>
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
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.overlay,
  },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: AllEntriesFilterUi.filterSheetTopRadius,
    borderTopRightRadius: AllEntriesFilterUi.filterSheetTopRadius,
    overflow: "hidden",
  },
  handleTouchArea: {
    alignItems: "center",
    justifyContent: "center",
    height: AllEntriesFilterUi.sheetHandleTouchHeight,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: AppColors.border,
    borderRadius: AllEntriesFilterUi.sheetHandleHeight / 2,
    height: AllEntriesFilterUi.sheetHandleHeight,
    width: AllEntriesFilterUi.sheetHandleWidth,
  },
  typeFilterRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: AppLayout.cardGap,
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
