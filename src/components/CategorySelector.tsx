import { type MenuAction, MenuView, type NativeActionEvent } from "@react-native-menu/menu";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
  CUSTOM_CATEGORY_DEFAULT_ICON,
  CategoryContextMenuCopy,
  CategoryCustomizerCopy,
} from "../constants/categoryCustomizer";
import { CATEGORY_GRID_GAP } from "../constants/categorySelector";
import { AppColors } from "../constants/colors";
import { FormLabelTextStyle } from "../constants/uiStyles";
import { useCustomCategories } from "../hooks/useCustomCategories";
import {
  resolveCategoryGridHeight,
  resolveCategoryGridMetrics,
  resolveCategoryGridPosition,
} from "../lib/categoryGrid";
import {
  createCustomCategory,
  mergeCustomCategories,
  normalizeCustomCategoryLabel,
  resolveCustomCategoryError,
  sortCategoriesByOrderIds,
} from "../lib/customCategories";
import type { CategoryDefinition, CategoryIconName } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";
import { CategoryAddGridItem } from "./categorySelector/CategoryAddGridItem";
import { CategoryCreateModal } from "./categorySelector/CategoryCreateModal";
import { CategoryGridItem } from "./categorySelector/CategoryGridItem";
import { CategoryManageModal } from "./categorySelector/CategoryManageModal";

const CategoryMenuAction = {
  delete: "delete-category",
  edit: "edit-category",
} as const;

type CategorySelectorProps = {
  bookId?: string | null;
  categories: readonly CategoryDefinition[];
  entryType: LedgerEntryType;
  selectedCategoryId: string;
  title: string;
  onSelectCategory: (category: CategoryDefinition | null) => void;
};

export function CategorySelector({
  bookId = null,
  categories,
  entryType,
  selectedCategoryId,
  title,
  onSelectCategory,
}: CategorySelectorProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null>(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryIconName, setNewCategoryIconName] = useState<CategoryIconName>(
    CUSTOM_CATEGORY_DEFAULT_ICON,
  );
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
  const {
    categoryOrderIds,
    customCategories,
    hiddenSystemCategoryIds,
    systemCategoryIconOverrides,
    systemCategoryLabelOverrides,
    saveCategoryOrderIds,
    saveCustomCategories,
    saveHiddenSystemCategoryIds,
    saveSystemCategoryCustomizations,
  } = useCustomCategories(entryType, bookId);
  const overriddenBaseCategories = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        iconName: systemCategoryIconOverrides[category.id] ?? category.iconName,
        label: systemCategoryLabelOverrides[category.id] ?? category.label,
      })),
    [categories, systemCategoryIconOverrides, systemCategoryLabelOverrides],
  );
  const visibleBaseCategories = useMemo(
    () =>
      overriddenBaseCategories.filter((category) => !hiddenSystemCategoryIds.includes(category.id)),
    [hiddenSystemCategoryIds, overriddenBaseCategories],
  );
  const displayedCategories = useMemo(
    () =>
      sortCategoriesByOrderIds(
        mergeCustomCategories(visibleBaseCategories, customCategories),
        categoryOrderIds,
      ),
    [categoryOrderIds, customCategories, visibleBaseCategories],
  );
  const { cellSize, columns } = resolveCategoryGridMetrics(gridWidth);
  const addButtonPosition = resolveCategoryGridPosition(
    displayedCategories.length,
    cellSize,
    columns,
  );
  const gridHeight = resolveCategoryGridHeight(displayedCategories.length + 1, cellSize, columns);
  const categoryMenuActions = useMemo<MenuAction[]>(
    () => [
      {
        id: CategoryMenuAction.edit,
        image: "pencil",
        imageColor: AppColors.text,
        title: CategoryContextMenuCopy.editAction,
      },
      {
        attributes: { destructive: true },
        id: CategoryMenuAction.delete,
        image: "trash",
        imageColor: AppColors.expense,
        title: CategoryCustomizerCopy.deleteAction,
      },
    ],
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={openCategoryManageModal}>
          <Text style={styles.manageAction}>{CategoryCustomizerCopy.manageAction}</Text>
        </Pressable>
      </View>
      <View
        onLayout={(event) => {
          setGridWidth(event.nativeEvent.layout.width);
        }}
        style={[styles.options, { height: gridHeight }]}
      >
        {displayedCategories.map((category, index) => {
          const position = resolveCategoryGridPosition(index, cellSize, columns);
          return (
            // 1. 탭 이벤트(선택)를 가장 바깥쪽 Pressable에서 처리합니다.
            <Pressable
              key={category.id}
              onPress={() => selectCategory(category)}
              style={[
                styles.categoryMenuAnchor,
                {
                  height: cellSize,
                  left: position.x,
                  top: position.y,
                  width: cellSize,
                },
              ]}
            >
              {/* 2. 길게 누르기(편집/삭제)는 MenuView에서 처리합니다. */}
              <MenuView
                actions={categoryMenuActions}
                onPressAction={(event) => handleCategoryMenuAction(event, category)}
                shouldOpenOnLongPress
                style={{ flex: 1 }} // 부모 크기만큼 꽉 채우기
              >
                {/* 3. 자식 요소가 터치를 가로채지 못하도록 pointerEvents="none"을 줍니다. */}
                <View pointerEvents="none" style={{ flex: 1 }}>
                  <CategoryGridItem
                    category={category}
                    cellSize={cellSize}
                    isActive={selectedCategoryId === category.id}
                    // ⚠️ onPressCategory props는 이제 불필요하므로 제거합니다.
                  />
                </View>
              </MenuView>
            </Pressable>
          );
        })}
        {cellSize > 0 ? (
          <CategoryAddGridItem
            cellSize={cellSize}
            left={addButtonPosition.x}
            onPress={startCategoryCreation}
            top={addButtonPosition.y}
          />
        ) : null}
      </View>
      <CategoryCreateModal
        actionLabel={editingCategory ? "저장" : undefined}
        errorMessage={newCategoryError}
        iconName={newCategoryIconName}
        isOpen={isCreateModalOpen}
        label={newCategoryLabel}
        title={editingCategory ? CategoryContextMenuCopy.editModalTitle : undefined}
        onCancel={cancelCategoryCreation}
        onChangeIcon={setNewCategoryIconName}
        onChangeLabel={(label) => {
          setNewCategoryLabel(label);
          setNewCategoryError(null);
        }}
        onSubmit={submitCategoryForm}
      />
      <CategoryManageModal
        categories={displayedCategories}
        isOpen={isManageModalOpen}
        onChangeOrder={saveCategoryOrder}
        onClose={() => setIsManageModalOpen(false)}
      />
    </View>
  );

  function submitCategoryForm() {
    if (editingCategory) {
      updateCategory();
      return;
    }

    createCategory();
  }

  function createCategory() {
    const nextLabel = normalizeCustomCategoryLabel(newCategoryLabel);
    const nextCategory: CategoryDefinition = {
      ...createCustomCategory(entryType, customCategories.length + 1),
      iconName: newCategoryIconName,
      label: nextLabel,
    };
    const nextCustomCategories = [...customCategories, nextCategory];
    const errorMessage = resolveCustomCategoryError(overriddenBaseCategories, nextCustomCategories);

    if (errorMessage) {
      setNewCategoryError(errorMessage);
      return;
    }

    saveCustomCategories(nextCustomCategories);
    onSelectCategory(nextCategory);
    resetCategoryCreationState();
  }

  function updateSystemCategory(category: CategoryDefinition) {
    const nextLabel = normalizeCustomCategoryLabel(newCategoryLabel);
    const nextCategory: CategoryDefinition = {
      ...category,
      iconName: newCategoryIconName,
      label: nextLabel,
    };
    const nextDisplayedCategories = displayedCategories.map((displayedCategory) =>
      displayedCategory.id === category.id ? nextCategory : displayedCategory,
    );
    const errorMessage = resolveCustomCategoryError([], nextDisplayedCategories);

    if (errorMessage) {
      setNewCategoryError(errorMessage);
      return;
    }

    saveSystemCategoryCustomizations({
      hiddenSystemCategoryIds,
      systemCategoryIconOverrides: {
        ...systemCategoryIconOverrides,
        [category.id]: newCategoryIconName,
      },
      systemCategoryLabelOverrides: {
        ...systemCategoryLabelOverrides,
        [category.id]: nextLabel,
      },
    });
    if (selectedCategoryId === category.id) {
      onSelectCategory(nextCategory);
    }
    resetCategoryCreationState();
  }

  function selectCategory(nextCategory: CategoryDefinition) {
    setIsCreateModalOpen(false);
    onSelectCategory(nextCategory);
  }

  function updateCategory() {
    if (!editingCategory) {
      return;
    }

    if (editingCategory.source === "system") {
      updateSystemCategory(editingCategory);
      return;
    }

    const nextLabel = normalizeCustomCategoryLabel(newCategoryLabel);
    const nextCustomCategories = customCategories.map((customCategory) =>
      customCategory.id === editingCategory.id
        ? {
            ...customCategory,
            iconName: newCategoryIconName,
            label: nextLabel,
          }
        : customCategory,
    );
    const errorMessage = resolveCustomCategoryError(overriddenBaseCategories, nextCustomCategories);

    if (errorMessage) {
      setNewCategoryError(errorMessage);
      return;
    }

    const nextCategory = nextCustomCategories.find(
      (category) => category.id === editingCategory.id,
    );
    saveCustomCategories(nextCustomCategories);
    if (selectedCategoryId === editingCategory.id && nextCategory) {
      onSelectCategory(nextCategory);
    }
    resetCategoryCreationState();
  }

  function openCategoryManageModal() {
    setIsCreateModalOpen(false);
    setIsManageModalOpen(true);
  }

  function saveCategoryOrder(nextCategories: CategoryDefinition[]) {
    saveCategoryOrderIds([...new Set(nextCategories.map((category) => category.id))]);
  }

  function handleCategoryMenuAction(event: NativeActionEvent, category: CategoryDefinition) {
    if (event.nativeEvent.event === CategoryMenuAction.edit) {
      editCategory(category);
      return;
    }

    if (event.nativeEvent.event === CategoryMenuAction.delete) {
      confirmDeleteCategory(category);
    }
  }

  function editCategory(category: CategoryDefinition) {
    setEditingCategory(category);
    setNewCategoryLabel(category.label);
    setNewCategoryIconName(category.iconName);
    setNewCategoryError(null);
    setIsCreateModalOpen(true);
  }

  function confirmDeleteCategory(category: CategoryDefinition) {
    Alert.alert(
      CategoryContextMenuCopy.deleteConfirmTitle,
      CategoryContextMenuCopy.deleteConfirmMessage,
      [
        {
          style: "cancel",
          text: "취소",
        },
        {
          onPress: () => deleteCategory(category),
          style: "destructive",
          text: CategoryCustomizerCopy.deleteAction,
        },
      ],
    );
  }

  function deleteCategory(category: CategoryDefinition) {
    if (category.source === "custom") {
      saveCustomCategories(
        customCategories.filter((customCategory) => customCategory.id !== category.id),
      );
    } else {
      saveHiddenSystemCategoryIds([...new Set([...hiddenSystemCategoryIds, category.id])]);
    }

    if (selectedCategoryId === category.id) {
      onSelectCategory(null);
    }
  }

  function startCategoryCreation() {
    resetCategoryCreationState();
    setIsCreateModalOpen(true);
  }

  function cancelCategoryCreation() {
    resetCategoryCreationState();
  }

  function resetCategoryCreationState() {
    setIsCreateModalOpen(false);
    setEditingCategory(null);
    setNewCategoryLabel("");
    setNewCategoryIconName(CUSTOM_CATEGORY_DEFAULT_ICON);
    setNewCategoryError(null);
  }
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  title: FormLabelTextStyle,
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  manageAction: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  options: {
    position: "relative",
    width: "100%",
    marginTop: CATEGORY_GRID_GAP,
  },
  categoryMenuAnchor: {
    position: "absolute",
  },
});
