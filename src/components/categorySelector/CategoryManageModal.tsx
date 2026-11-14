import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
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
  CATEGORY_MANAGE_SCROLL_SETTLE_DELAY_MS,
} from "../../constants/categorySelector";
import { getAppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { getSupportingTextStyle } from "../../constants/uiStyles";
import type { CategoryDefinition } from "../../types/category";
import {
  resolveCategoryGridHeight,
  resolveCategoryGridMetrics,
  resolveCategoryGridPosition,
  resolveCategoryGridScrollY,
} from "../../lib/categoryGrid";
import { CategoryManageTile } from "./CategoryManageTile";

type CategoryManageModalProps = {
  onEdit?: (category: CategoryDefinition) => void;
  onDelete?: (category: CategoryDefinition) => void;
  isBusy?: boolean;
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
  onEdit,
  onDelete,
  isBusy = false,
  creationModal,
  title = CategoryCustomizerCopy.manageModalTitle,
  isLoading = false,
  categories,
  isOpen,
  onClose,
  onChangeOrder,
}: CategoryManageModalProps) {
  const styles = getStyles();
  useAppTheme();
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
  const listScrollYRef = useRef(0);
  const [gridWidth, setGridWidth] = useState(0);
  const { cellSize, columns } = resolveCategoryGridMetrics(gridWidth);
  const gridHeight = resolveCategoryGridHeight(orderedCategories.length, cellSize, columns);
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
    (categoryIndex: number) => {
      clearPendingCategoryScroll();
      pendingScrollTimeoutRef.current = setTimeout(() => {
        pendingScrollTimeoutRef.current = null;
        listScrollRef.current?.scrollTo({
          animated: true,
          y: resolveCategoryGridScrollY(
            categoryIndex,
            cellSize,
            columns,
            listScrollYRef.current,
            listViewportHeightRef.current,
          ),
        });
      }, CATEGORY_MANAGE_SCROLL_SETTLE_DELAY_MS);
    },
    [cellSize, columns, clearPendingCategoryScroll],
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

  useEffect(() => clearPendingCategoryScroll, [cellSize, columns, clearPendingCategoryScroll]);

  const selectedIndex = orderedCategories.findIndex(
    (category) => category.id === selectedCategoryId,
  );
  const canMovePrevious = selectedIndex > 0;
  const canMoveNext = selectedIndex >= 0 && selectedIndex < orderedCategories.length - 1;
  const canSave =
    !isLoading && !isBusy && !saving && !areCategoryOrdersEqual(categories, orderedCategories);
  function changeEntryType(nextType: LedgerEntryType) {
    if (nextType === entryType || savingRef.current || isBusy || isLoading) return;
    if (!canSave) {
      onChangeEntryType(nextType);
      return;
    }
    Alert.alert(
      CategoryCustomizerCopy.discardOrderTitle,
      CategoryCustomizerCopy.discardOrderMessage,
      [
        { text: CategoryCustomizerCopy.keepEditingAction, style: "cancel" },
        {
          text: CategoryCustomizerCopy.switchTabAction,
          onPress: () => onChangeEntryType(nextType),
        },
      ],
    );
  }

  const moveSelectedCategory = useCallback(
    (direction: -1 | 1) => {
      if (savingRef.current || isBusy || isLoading) return;
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
      scheduleCategoryScroll(nextIndex);
    },
    [isBusy, isLoading, orderedCategories, scheduleCategoryScroll, selectedIndex],
  );

  const saveCategoryOrder = useCallback(async () => {
    if (savingRef.current || isBusy) return;
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
  }, [isBusy, onChangeOrder, onClose, orderedCategories]);

  const closeWithoutSaving = useCallback(() => {
    if (savingRef.current || isBusy) return;
    clearPendingCategoryScroll();
    onClose();
  }, [clearPendingCategoryScroll, isBusy, onClose]);

  const handlePressSave = useCallback(() => {
    if (canSave) void saveCategoryOrder();
  }, [canSave, saveCategoryOrder]);

  const handlePressMovePrevious = useCallback(() => {
    moveSelectedCategory(-1);
  }, [moveSelectedCategory]);

  const handlePressMoveNext = useCallback(() => {
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
    <NativeSelectionSheet
      isOpen={isOpen}
      onClose={closeWithoutSaving}
      dismissible={!saving && !isBusy}
      title={title}
      header={
        <EntryComposerHeader
          type={entryType}
          onSelectType={changeEntryType}
          typeDisabled={saving || isBusy || isLoading}
          saving={saving}
          actionDisabled={!canSave}
          actionLabel={CategoryCustomizerCopy.saveAction}
          onAction={handlePressSave}
          onClose={closeWithoutSaving}
        />
      }
    >
      <View style={styles.sheet}>
        <ActionButton
          label={CategoryCustomizerCopy.addAccessibilityLabel}
          onPress={onAdd}
          disabled={saving || isBusy || isLoading}
          size="inline"
        />
        <ScrollView
          {...AppScrollBehavior}
          style={styles.list}
          onLayout={(event) => {
            listViewportHeightRef.current = event.nativeEvent.layout.height;
          }}
          ref={listScrollRef}
          onScroll={(event) => {
            listScrollYRef.current = event.nativeEvent.contentOffset.y;
          }}
          showsVerticalScrollIndicator
        >
          <View
            style={{ height: isLoading ? 0 : gridHeight }}
            onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
          >
            {!isLoading &&
              orderedCategories.map((category, index) => (
                <CategoryManageTile
                  onEdit={onEdit}
                  onDelete={onDelete}
                  disabled={saving || isBusy || isLoading}
                  category={category}
                  cellSize={cellSize}
                  position={resolveCategoryGridPosition(index, cellSize, columns)}
                  isSelected={category.id === selectedCategoryId}
                  key={category.id}
                  onPress={() => selectCategory(category.id)}
                />
              ))}
          </View>
        </ScrollView>
        <View style={styles.moveActionRow}>
          <CategoryMoveButton
            disabled={saving || isBusy || isLoading || !canMovePrevious}
            iconName="arrow-left"
            label={CategoryCustomizerCopy.movePreviousAction}
            onPress={handlePressMovePrevious}
          />
          <CategoryMoveButton
            disabled={saving || isBusy || isLoading || !canMoveNext}
            iconName="arrow-right"
            label={CategoryCustomizerCopy.moveNextAction}
            onPress={handlePressMoveNext}
          />
        </View>
        {isLoading ? (
          <Text style={getSupportingTextStyle()}>{CategoryCustomizerCopy.loadingCategories}</Text>
        ) : null}
        {saveError ? (
          <Text style={styles.saveError}>{CategoryCustomizerCopy.saveError}</Text>
        ) : null}
      </View>
      {creationModal}
    </NativeSelectionSheet>
  );
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

function CategoryMoveButton({
  disabled,
  iconName,
  label,
  onPress,
}: {
  disabled: boolean;
  iconName: "arrow-left" | "arrow-right";
  label: string;
  onPress: () => void;
}) {
  const styles = getStyles();
  useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.moveButton, disabled ? styles.disabledMoveButton : null]}
    >
      <Feather
        color={disabled ? getAppColors().mutedText : getAppColors().onPrimary}
        name={iconName}
        size={CATEGORY_MANAGE_MOVE_BUTTON_ICON_SIZE}
      />
      <Text style={[styles.moveButtonText, disabled ? styles.disabledMoveButtonText : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    saveError: { ...getSupportingTextStyle(), color: getAppColors().expense },
    sheet: { flex: 1, padding: AppLayout.cardContentPadding, gap: AppLayout.cardGap },
    list: { flex: 1 },
    moveActionRow: {
      flexDirection: "row",
      gap: AppLayout.cardGap,
    },
    moveButton: {
      flex: 1,
      minHeight: CATEGORY_MANAGE_ACTION_BUTTON_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: AppLayout.compactGap,
      borderRadius: AppLayout.groupRadius,
      backgroundColor: getAppColors().primary,
    },
    disabledMoveButton: {
      backgroundColor: getAppColors().surfaceStrong,
    },
    moveButtonText: {
      color: getAppColors().onPrimary,
      fontSize: 14,
      fontWeight: "800",
    },
    disabledMoveButtonText: {
      color: getAppColors().mutedText,
    },
  }),
);
