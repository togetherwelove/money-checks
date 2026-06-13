import { selectStaticCopy } from "../i18n/staticCopy";
import type { CategoryIconName } from "../types/category";

export const CATEGORY_CUSTOMIZATION_STORAGE_KEY = "moneychecks.category-customization.v1";
export const CUSTOM_CATEGORY_ID_PREFIX = "custom-category";
export const CUSTOM_CATEGORY_DEFAULT_ICON: CategoryIconName = "circle";
export const CUSTOM_CATEGORY_MAX_NAME_LENGTH = 12;

export const CategoryCustomizerCopy = selectStaticCopy({
  en: {
    addAccessibilityLabel: "Add category",
    createAction: "Add",
    createIconLabel: "Icon",
    createModalTitle: "Add category",
    createNameLabel: "Name",
    deleteAction: "Delete",
    deleteConfirmMessage: "Delete this category?",
    deleteConfirmTitle: "Delete category",
    duplicateError: "This category name is already in use.",
    emptyError: "Enter a category name.",
    manageAction: "Manage",
    manageModalTitle: "Manage categories",
    moveDownAction: "Move down",
    moveUpAction: "Move up",
    namePlaceholder: "Category name",
    newCategoryNamePrefix: "New Category",
  },
  ko: {
    addAccessibilityLabel: "분류 추가",
    createAction: "등록",
    createIconLabel: "아이콘",
    createModalTitle: "새 분류 추가",
    createNameLabel: "이름",
    deleteAction: "삭제",
    deleteConfirmMessage: "이 분류를 삭제할까요?",
    deleteConfirmTitle: "분류 삭제",
    duplicateError: "같은 분류 이름은 사용할 수 없어요.",
    emptyError: "분류 이름을 입력해 주세요.",
    manageAction: "관리",
    manageModalTitle: "분류 관리",
    moveDownAction: "아래로",
    moveUpAction: "위로",
    namePlaceholder: "분류 이름",
    newCategoryNamePrefix: "새 분류",
  },
} as const);

export const CategoryContextMenuCopy = selectStaticCopy({
  en: {
    deleteConfirmMessage: "Delete this category?",
    deleteConfirmTitle: "Delete category",
    editAction: "Edit",
    editModalTitle: "Edit category",
  },
  ko: {
    deleteConfirmMessage: "이 분류를 삭제할까요?",
    deleteConfirmTitle: "분류 삭제",
    editAction: "수정",
    editModalTitle: "분류 수정",
  },
} as const);
