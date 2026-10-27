import { NativeSelectionSheet } from "../NativeSelectionSheet";
import { AppScrollBehavior } from "../../constants/scroll";
import { Feather } from "../AppIcons";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ScrollViewInstance } from "react-native";
import type { LedgerEntryType } from "../../types/ledger";
import { EntryComposerHeader } from "../entryComposer/EntryComposerHeader";
import { ActionButton } from "../ActionButton";

import { CategoryCustomizerCopy } from "../../constants/categoryCustomizer";
import {
  CATEGORY_MANAGE_ACTION_BUTTON_HEIGHT,
  CATEGORY_MANAGE_MOVE_BUTTON_ICON_SIZE,
  CATEGORY_MANAGE_ROW_GAP,
  CATEGORY_MANAGE_ROW_HEIGHT,
  CATEGORY_MANAGE_ROW_ICON_SIZE,
  CATEGORY_MANAGE_SCROLL_SETTLE_DELAY_MS,
} from "../../constants/categorySelector";
import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { SupportingTextStyle } from "../../constants/uiStyles";
import type { CategoryDefinition } from "../../types/category";

type CategoryManageModalProps = {
  entryType: LedgerEntryType;
  onChangeEntryType: (type: LedgerEntryType) => void;
  onAdd: () => void;
  creationModal: ReactNode;
  title?: string;
  isLoading?: boolean;
  categories: readonly CategoryDefinition[];
  isOpen: boolean;
  onClose: () => void;
  onChangeOrder: (categories: CategoryDefinition[]) => Promise<boolean>;
};

export function CategoryManageModal({
  entryType,
  onChangeEntryType,
  onAdd,
  creationModal,
  title = CategoryCustomizerCopy.manageModalTitle,
  isLoading = false,
  categories,
  isOpen,
  onClose,
  onChangeOrder,
}: CategoryManageModalProps) {
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [orderedCategories, setOrderedCategories] = useState<CategoryDefinition[]>(() => [
    ...categories,
  ]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?.id ?? null,
  );
  const listScrollRef = useRef<ScrollViewInstance | null>(null);
  const listViewportHeightRef = useRef(0);
  const pendingScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOpenRef = useRef(false);

  const clearPendingCategoryScroll = useCallback(() => {
    if (!pendingScrollTimeoutRef.current) {
      return;
    }

    clearTimeout(pendingScrollTimeoutRef.current);
    pendingScrollTimeoutRef.current = null;
  }, []);

  const scheduleCategoryScroll = useCallback(
    (categoryIndex: number, direction: -1 | 1) => {
      clearPendingCategoryScroll();
      pendingScrollTimeoutRef.current = setTimeout(() => {
        pendingScrollTimeoutRef.current = null;
        listScrollRef.current?.scrollTo({
          animated: true,
          y: resolveCategoryScrollY(categoryIndex, direction, listViewportHeightRef.current),
        });
      }, CATEGORY_MANAGE_SCROLL_SETTLE_DELAY_MS);
    },
    [clearPendingCategoryScroll],
  );

  useEffect(() => {
    wasOpenRef.current = false;
    setSaveError(false);
  }, [entryType]);

  useEffect(() => {
    if (!isOpen || isLoading) {
      wasOpenRef.current = false;
      clearPendingCategoryScroll();
      return;
    }
    if (wasOpenRef.current) {
      setOrderedCategories((current) => {
        const categoriesById = new Map(categories.map((category) => [category.id, category]));
        const currentIds = new Set(current.map((category) => category.id));
        return [
          ...current.flatMap((category) => categoriesById.get(category.id) ?? []),
          ...categories.filter((category) => !currentIds.has(category.id)),
        ];
      });
      return;
    }
    wasOpenRef.current = true;

    const nextCategories = [...categories];

    setOrderedCategories(nextCategories);
    setSelectedCategoryId((currentCategoryId) =>
      nextCategories.some((category) => category.id === currentCategoryId)
        ? currentCategoryId
        : (nextCategories[0]?.id ?? null),
    );
  }, [categories, clearPendingCategoryScroll, isOpen, isLoading, entryType]);

  useEffect(() => clearPendingCategoryScroll, [clearPendingCategoryScroll]);

  const selectedIndex = orderedCategories.findIndex(
    (category) => category.id === selectedCategoryId,
  );
  const canMoveUp = selectedIndex > 0;
  const canMoveDown = selectedIndex >= 0 && selectedIndex < orderedCategories.length - 1;
  const canSave = !isLoading && !saving && !areCategoryOrdersEqual(categories, orderedCategories);
  function changeEntryType(nextType: LedgerEntryType) {
    if (nextType === entryType || savingRef.current || isLoading) return;
    if (!canSave) { onChangeEntryType(nextType); return; }
    Alert.alert(CategoryCustomizerCopy.discardOrderTitle, CategoryCustomizerCopy.discardOrderMessage, [
      { text: CategoryCustomizerCopy.keepEditingAction, style: "cancel" },
      { text: CategoryCustomizerCopy.switchTabAction, onPress: () => onChangeEntryType(nextType) },
    ]);
  }

  const moveSelectedCategory = useCallback(
    (direction: -1 | 1) => {
      if (savingRef.current || isLoading) return;
      if (selectedIndex < 0) {
        return;
      }

      const nextIndex = selectedIndex + direction;
      if (nextIndex < 0 || nextIndex >= orderedCategories.length) {
        return;
      }

      const nextCategories = [...orderedCategories];
      const [movingCategory] = nextCategories.splice(selectedIndex, 1);
      nextCategories.splice(nextIndex, 0, movingCategory);
      setOrderedCategories(nextCategories);
      scheduleCategoryScroll(nextIndex, direction);
    },
    [isLoading, orderedCategories, scheduleCategoryScroll, selectedIndex],
  );

  const saveCategoryOrder = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      if (await onChangeOrder(orderedCategories)) onClose();
      else setSaveError(true);
    } catch {
      setSaveError(true);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [onChangeOrder, onClose, orderedCategories]);

  const closeWithoutSaving = useCallback(() => {
    if (savingRef.current) return;
    clearPendingCategoryScroll();
    onClose();
  }, [clearPendingCategoryScroll, onClose]);

  const handlePressSave = useCallback(() => {
    if (canSave) void saveCategoryOrder();
  }, [canSave, saveCategoryOrder]);

  const handlePressMoveUp = useCallback(() => {
    moveSelectedCategory(-1);
  }, [moveSelectedCategory]);

  const handlePressMoveDown = useCallback(() => {
    moveSelectedCategory(1);
  }, [moveSelectedCategory]);

  const selectCategory = useCallback(
    (categoryId: string) => {
      clearPendingCategoryScroll();
      setSelectedCategoryId(categoryId);
    },
    [clearPendingCategoryScroll],
  );

  return (
    <NativeSelectionSheet isOpen={isOpen} onClose={closeWithoutSaving} dismissible={!saving} title={title}
      header={<EntryComposerHeader type={entryType} onSelectType={changeEntryType}
        typeDisabled={saving || isLoading} saving={saving} actionDisabled={!canSave}
        actionLabel={CategoryCustomizerCopy.saveAction} onAction={handlePressSave} onClose={closeWithoutSaving} />}>
      <View style={styles.sheet}>
          <ActionButton label={CategoryCustomizerCopy.addAccessibilityLabel} onPress={onAdd} disabled={saving || isLoading} size="inline" />
          <ScrollView {...AppScrollBehavior}
            contentContainerStyle={styles.listContent}
            onLayout={(event) => {
              listViewportHeightRef.current = event.nativeEvent.layout.height;
            }}
            ref={listScrollRef}
            showsVerticalScrollIndicator
          >
            {!isLoading && orderedCategories.map((category) => (
              <CategoryManageRow
                category={category}
                isSelected={category.id === selectedCategoryId}
                key={category.id}
                onPress={() => selectCategory(category.id)}
              />
            ))}
          </ScrollView>
          <View style={styles.moveActionRow}>
            <CategoryMoveButton
              disabled={saving || !canMoveUp}
              iconName="arrow-up"
              label={CategoryCustomizerCopy.moveUpAction}
              onPress={handlePressMoveUp}
            />
            <CategoryMoveButton
              disabled={saving || !canMoveDown}
              iconName="arrow-down"
              label={CategoryCustomizerCopy.moveDownAction}
              onPress={handlePressMoveDown}
            />
          </View>
          {isLoading ? <Text style={SupportingTextStyle}>{CategoryCustomizerCopy.loadingCategories}</Text> : null}
          {saveError ? <Text style={styles.saveError}>{CategoryCustomizerCopy.saveError}</Text> : null}
      </View>
      {creationModal}
    </NativeSelectionSheet>
  );
}

function resolveCategoryScrollY(
  categoryIndex: number,
  direction: -1 | 1,
  viewportHeight: number,
): number {
  const rowSpan = CATEGORY_MANAGE_ROW_HEIGHT + CATEGORY_MANAGE_ROW_GAP;
  if (direction > 0 || viewportHeight <= 0) {
    return categoryIndex * rowSpan;
  }

  const rowBottomWithMargin = categoryIndex * rowSpan + CATEGORY_MANAGE_ROW_HEIGHT + rowSpan;
  return Math.max(0, rowBottomWithMargin - viewportHeight);
}

function areCategoryOrdersEqual(
  currentCategories: readonly CategoryDefinition[],
  nextCategories: readonly CategoryDefinition[],
): boolean {
  if (currentCategories.length !== nextCategories.length) {
    return false;
  }

  return currentCategories.every((category, index) => category.id === nextCategories[index]?.id);
}

function CategoryManageRow({
  category,
  isSelected,
  onPress,
}: {
  category: CategoryDefinition;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, isSelected ? styles.selectedRow : null]}>
      <View style={styles.categoryMeta}>
        <Feather
          color={isSelected ? AppColors.primary : AppColors.mutedText}
          name={category.iconName}
          size={CATEGORY_MANAGE_ROW_ICON_SIZE}
        />
        <Text
          numberOfLines={1}
          style={[styles.categoryLabel, isSelected ? styles.selectedCategoryLabel : null]}
        >
          {category.label}
        </Text>
      </View>
    </Pressable>
  );
}

function CategoryMoveButton({
  disabled,
  iconName,
  label,
  onPress,
}: {
  disabled: boolean;
  iconName: "arrow-down" | "arrow-up";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.moveButton, disabled ? styles.disabledMoveButton : null]}
    >
      <Feather
        color={disabled ? AppColors.mutedText : AppColors.inverseText}
        name={iconName}
        size={CATEGORY_MANAGE_MOVE_BUTTON_ICON_SIZE}
      />
      <Text style={[styles.moveButtonText, disabled ? styles.disabledMoveButtonText : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  saveError: { ...SupportingTextStyle, color: AppColors.expense },
  sheet: { flex: 1, padding: AppLayout.cardContentPadding, gap: AppLayout.cardGap },
  listContent: {
    gap: CATEGORY_MANAGE_ROW_GAP,
  },
  row: {
    minHeight: CATEGORY_MANAGE_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    backgroundColor: AppColors.background,
  },
  selectedRow: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  categoryMeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryLabel: {
    flex: 1,
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  selectedCategoryLabel: {
    color: AppColors.primary,
  },
  moveActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  moveButton: {
    flex: 1,
    minHeight: CATEGORY_MANAGE_ACTION_BUTTON_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
  },
  disabledMoveButton: {
    backgroundColor: AppColors.surfaceStrong,
  },
  moveButtonText: {
    color: AppColors.inverseText,
    fontSize: 14,
    fontWeight: "800",
  },
  disabledMoveButtonText: {
    color: AppColors.mutedText,
  },
});
