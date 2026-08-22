import { Feather } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  type AllEntriesEntryTypeFilter,
  AllEntriesEntryTypeFilters,
  AllEntriesFilterCopy,
  AllEntriesFilterUi,
  formatAllEntriesEntryTypeFilterLabel,
} from "../../constants/allEntries";
import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { FormInputTextStyle } from "../../constants/uiStyles";
import type { CategoryDefinition } from "../../types/category";
import { countAllEntriesFilters } from "../../lib/allEntriesFilters";

type AllEntriesFilterBarProps = {
  categories: readonly CategoryDefinition[];
  entryTypeFilter: AllEntriesEntryTypeFilter;
  onChangeSearchQuery: (searchQuery: string) => void;
  onOpenFilter: () => void;
  onRemoveCategory: (categoryId: string) => void;
  onRemoveEntryType: () => void;
  onReset: () => void;
  searchQuery: string;
  selectedCategoryIds: readonly string[];
};

export function AllEntriesFilterBar({
  categories,
  entryTypeFilter,
  onChangeSearchQuery,
  onOpenFilter,
  onRemoveCategory,
  onRemoveEntryType,
  onReset,
  searchQuery,
  selectedCategoryIds,
}: AllEntriesFilterBarProps) {
  const filterCount = countAllEntriesFilters(entryTypeFilter, selectedCategoryIds);
  const hasActiveFilters = searchQuery.trim().length > 0 || filterCount > 0;
  const categoryLabelById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories],
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={onChangeSearchQuery}
          placeholder={AllEntriesFilterCopy.searchPlaceholder}
          returnKeyType="search"
          style={styles.searchInput}
          value={searchQuery}
        />
        <Pressable
          accessibilityLabel={AllEntriesFilterCopy.filterAccessibilityLabel}
          accessibilityRole="button"
          onPress={onOpenFilter}
          style={({ pressed }) => [styles.filterButton, pressed ? styles.pressed : null]}
        >
          <Feather color={AppColors.primary} name="sliders" size={AllEntriesFilterUi.iconSize} />
          <Text style={styles.filterButtonLabel}>{AllEntriesFilterCopy.filterLabel}</Text>
          {filterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeLabel}>{filterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {hasActiveFilters ? (
        <View style={styles.activeFilterRow}>
          {filterCount > 0 ? (
            <ScrollView
              contentContainerStyle={styles.activeFilterContent}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.activeFilterList}
            >
              {entryTypeFilter !== AllEntriesEntryTypeFilters.all ? (
                <ActiveFilterChip
                  label={formatAllEntriesEntryTypeFilterLabel(entryTypeFilter)}
                  onRemove={onRemoveEntryType}
                />
              ) : null}
              {selectedCategoryIds.map((categoryId) => {
                const categoryLabel = categoryLabelById.get(categoryId);
                return categoryLabel ? (
                  <ActiveFilterChip
                    key={categoryId}
                    label={categoryLabel}
                    onRemove={() => onRemoveCategory(categoryId)}
                  />
                ) : null;
              })}
            </ScrollView>
          ) : null}
          <Pressable
            accessibilityLabel={AllEntriesFilterCopy.resetAccessibilityLabel}
            accessibilityRole="button"
            onPress={onReset}
            style={({ pressed }) => [styles.resetButton, pressed ? styles.pressed : null]}
          >
            <Feather
              color={AppColors.primary}
              name="rotate-ccw"
              size={AllEntriesFilterUi.iconSize}
            />
            <Text style={styles.resetLabel}>{AllEntriesFilterCopy.resetLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`${label} ${AllEntriesFilterCopy.removeFilterAccessibilitySuffix}`}
      accessibilityRole="button"
      onPress={onRemove}
      style={({ pressed }) => [styles.activeFilterChip, pressed ? styles.pressed : null]}
    >
      <Text numberOfLines={1} style={styles.activeFilterChipLabel}>
        {label}
      </Text>
      <Feather
        color={AppColors.primary}
        name="x"
        size={AllEntriesFilterUi.activeFilterChipIconSize}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    gap: AppLayout.compactGap,
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: AppLayout.compactGap,
  },
  searchInput: {
    ...FormInputTextStyle,
    flex: 1,
    minWidth: 0,
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: AppColors.capsuleSurface,
    borderColor: AppColors.border,
    borderRadius: AllEntriesFilterUi.categoryChipRadius,
    borderWidth: 1,
    flexDirection: "row",
    gap: AppLayout.compactGap,
    justifyContent: "center",
    minHeight: AllEntriesFilterUi.filterButtonMinimumHeight,
    paddingHorizontal: AllEntriesFilterUi.filterButtonHorizontalPadding,
  },
  filterButtonLabel: {
    color: AppColors.primary,
    fontSize: AllEntriesFilterUi.filterButtonLabelFontSize,
    fontWeight: "700",
  },
  filterBadge: {
    alignItems: "center",
    backgroundColor: AppColors.primary,
    borderRadius: AllEntriesFilterUi.badgeMinimumSize / 2,
    justifyContent: "center",
    minHeight: AllEntriesFilterUi.badgeMinimumSize,
    minWidth: AllEntriesFilterUi.badgeMinimumSize,
    paddingHorizontal: AppLayout.compactGap,
  },
  filterBadgeLabel: {
    color: AppColors.inverseText,
    fontSize: AllEntriesFilterUi.badgeFontSize,
    fontWeight: "800",
  },
  activeFilterList: {
    flexGrow: 0,
    flexShrink: 1,
    maxWidth: "100%",
  },
  activeFilterRow: {
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    gap: AppLayout.compactGap,
    justifyContent: "flex-end",
  },
  activeFilterContent: {
    gap: AppLayout.compactGap,
    paddingRight: AppLayout.screenPadding,
  },
  activeFilterChip: {
    alignItems: "center",
    backgroundColor: AppColors.surfaceStrong,
    borderColor: AppColors.primary,
    borderRadius: AllEntriesFilterUi.categoryChipRadius,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: AppLayout.compactGap,
    minHeight: AllEntriesFilterUi.activeFilterChipHeight,
    paddingHorizontal: AllEntriesFilterUi.activeFilterChipHorizontalPadding,
  },
  activeFilterChipLabel: {
    color: AppColors.primary,
    fontSize: AllEntriesFilterUi.activeFilterChipLabelFontSize,
    fontWeight: "700",
    maxWidth: "100%",
  },
  resetButton: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: AppLayout.compactGap,
    minHeight: AllEntriesFilterUi.activeFilterChipHeight,
  },
  resetLabel: {
    color: AppColors.primary,
    fontSize: AllEntriesFilterUi.resetLabelFontSize,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
});
