import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";

import { CATEGORY_ICON_PICKER_OPTIONS } from "../../constants/categories";
import {
  CATEGORY_CUSTOMIZER_AUTO_SCROLL_EDGE_THRESHOLD,
  CATEGORY_CUSTOMIZER_AUTO_SCROLL_STEP,
  CATEGORY_CUSTOMIZER_ICON_PICKER_GAP,
  CATEGORY_CUSTOMIZER_LIST_BOTTOM_PADDING,
  CATEGORY_CUSTOMIZER_LIST_MAX_HEIGHT,
  CATEGORY_CUSTOMIZER_ROW_GAP,
  CATEGORY_CUSTOMIZER_SECTION_GAP,
  CategoryCustomizerCopy,
} from "../../constants/categoryCustomizer";
import { AppColors } from "../../constants/colors";
import { CommonActionCopy } from "../../constants/commonActions";
import { NoteTextStyle, StatusMessageTextStyle } from "../../constants/uiStyles";
import {
  createCustomCategory,
  normalizeCustomCategoryLabel,
  resolveCustomCategoryError,
} from "../../lib/customCategories";
import type { CategoryDefinition, CategoryIconName } from "../../types/category";
import type { LedgerEntryType } from "../../types/ledger";
import { ActionButton } from "../ActionButton";
import { CalendarPickerModalShell } from "../calendarPicker/CalendarPickerModalShell";
import { CategoryCustomizerRow } from "./CategoryCustomizerRow";

type CategoryCustomizerModalProps = {
  categories: CategoryDefinition[];
  baseCategories: readonly CategoryDefinition[];
  entryType: LedgerEntryType;
  isOpen: boolean;
  onClose: () => void;
  onSaveCategories: (nextCategories: CategoryDefinition[]) => void;
};

type CategoryListHandle = {
  scrollToEnd?: (params?: { animated?: boolean }) => void;
};

export function CategoryCustomizerModal({
  categories,
  baseCategories,
  entryType,
  isOpen,
  onClose,
  onSaveCategories,
}: CategoryCustomizerModalProps) {
  const [draftCategories, setDraftCategories] = useState<CategoryDefinition[]>(categories);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeIconCategoryId, setActiveIconCategoryId] = useState<string | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const listRef = useRef<CategoryListHandle | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftCategories(categories);
    setStatusMessage(null);
    setActiveIconCategoryId(null);
    setShouldScrollToBottom(false);
  }, [categories, isOpen]);

  const activeIconCategory = useMemo(
    () => draftCategories.find((category) => category.id === activeIconCategoryId) ?? null,
    [activeIconCategoryId, draftCategories],
  );

  return (
    <CalendarPickerModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={CategoryCustomizerCopy.modalTitle}
    >
      <Text style={styles.description}>{CategoryCustomizerCopy.description}</Text>
      <View style={styles.listViewport}>
        <DraggableFlatList
          activationDistance={12}
          autoscrollSpeed={CATEGORY_CUSTOMIZER_AUTO_SCROLL_STEP}
          autoscrollThreshold={CATEGORY_CUSTOMIZER_AUTO_SCROLL_EDGE_THRESHOLD}
          contentContainerStyle={styles.listContent}
          data={draftCategories}
          dragItemOverflow={false}
          ItemSeparatorComponent={ListSeparator}
          keyExtractor={(category) => category.id}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (!shouldScrollToBottom) {
              return;
            }

            requestAnimationFrame(() => {
              listRef.current?.scrollToEnd?.({ animated: true });
              setShouldScrollToBottom(false);
            });
          }}
          onDragBegin={() => setStatusMessage(null)}
          onDragEnd={({ data }) => setDraftCategories(data)}
          ref={(value) => {
            listRef.current = value as CategoryListHandle | null;
          }}
          renderItem={renderCategoryRow}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      </View>
      {activeIconCategory ? (
        <View style={styles.iconPickerSection}>
          <Text style={styles.iconPickerLabel}>
            {activeIconCategory.label} / {CategoryCustomizerCopy.iconPickerTitle}
          </Text>
          <DraggableIconPicker
            activeIconName={activeIconCategory.iconName}
            onSelectIcon={handleSelectIcon}
          />
        </View>
      ) : null}
      <View style={styles.footer}>
        <ActionButton
          label={CategoryCustomizerCopy.addButton}
          onPress={() => {
            setStatusMessage(null);
            setShouldScrollToBottom(true);
            setDraftCategories((currentCategories) => [
              ...currentCategories,
              createCustomCategory(entryType, currentCategories.length + 1),
            ]);
          }}
          size="inline"
          variant="secondary"
        />
        <ActionButton label={CommonActionCopy.save} onPress={handleSave} size="inline" />
      </View>
      {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
    </CalendarPickerModalShell>
  );

  function renderCategoryRow({ drag, isActive, item }: RenderItemParams<CategoryDefinition>) {
    return (
      <ScaleDecorator activeScale={1.02}>
        <CategoryCustomizerRow
          category={item}
          isDragging={isActive}
          isIconPickerActive={activeIconCategoryId === item.id}
          onChangeLabel={(categoryId, label) => {
            setStatusMessage(null);
            setDraftCategories((currentCategories) =>
              currentCategories.map((currentCategory) =>
                currentCategory.id === categoryId ? { ...currentCategory, label } : currentCategory,
              ),
            );
          }}
          onDeleteCategory={handleDeleteCategory}
          onDrag={drag}
          onOpenIconPicker={(categoryId) =>
            setActiveIconCategoryId((currentId) => (currentId === categoryId ? null : categoryId))
          }
        />
      </ScaleDecorator>
    );
  }

  function handleDeleteCategory(categoryId: string) {
    setStatusMessage(null);
    setDraftCategories((currentCategories) =>
      currentCategories.filter((category) => category.id !== categoryId),
    );
    setActiveIconCategoryId((currentId) => (currentId === categoryId ? null : currentId));
  }

  function handleSelectIcon(iconName: CategoryIconName) {
    if (!activeIconCategoryId) {
      return;
    }

    setDraftCategories((currentCategories) =>
      currentCategories.map((category) =>
        category.id === activeIconCategoryId ? { ...category, iconName } : category,
      ),
    );
  }

  function handleSave() {
    const normalizedCategories = draftCategories.map((category) =>
      category.source === "custom"
        ? { ...category, label: normalizeCustomCategoryLabel(category.label) }
        : category,
    );
    const nextCustomCategories = normalizedCategories.filter(
      (category) => category.source === "custom",
    );
    const nextError = resolveCustomCategoryError(baseCategories, nextCustomCategories);
    if (nextError) {
      setStatusMessage(nextError);
      return;
    }

    onSaveCategories(normalizedCategories);
    onClose();
  }
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

type DraggableIconPickerProps = {
  activeIconName: CategoryIconName;
  onSelectIcon: (iconName: CategoryIconName) => void;
};

function DraggableIconPicker({ activeIconName, onSelectIcon }: DraggableIconPickerProps) {
  return (
    <View style={styles.iconGrid}>
      {CATEGORY_ICON_PICKER_OPTIONS.map((iconName) => (
        <Pressable
          key={iconName}
          onPress={() => onSelectIcon(iconName)}
          style={[styles.iconButton, activeIconName === iconName ? styles.activeIconButton : null]}
        >
          <Feather
            color={activeIconName === iconName ? AppColors.primary : AppColors.mutedText}
            name={iconName}
            size={18}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  description: NoteTextStyle,
  listViewport: {
    maxHeight: CATEGORY_CUSTOMIZER_LIST_MAX_HEIGHT,
  },
  list: {
    maxHeight: CATEGORY_CUSTOMIZER_LIST_MAX_HEIGHT,
  },
  listContent: {
    paddingTop: 2,
    paddingBottom: CATEGORY_CUSTOMIZER_LIST_BOTTOM_PADDING,
  },
  separator: {
    height: CATEGORY_CUSTOMIZER_ROW_GAP,
  },
  iconPickerSection: {
    gap: CATEGORY_CUSTOMIZER_SECTION_GAP,
    paddingTop: 2,
  },
  iconPickerLabel: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CATEGORY_CUSTOMIZER_ICON_PICKER_GAP,
    paddingVertical: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.surface,
  },
  activeIconButton: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: CATEGORY_CUSTOMIZER_ROW_GAP,
  },
  status: {
    color: AppColors.expense,
    ...StatusMessageTextStyle,
  },
});
