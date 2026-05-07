import { selectStaticCopy } from "../i18n/staticCopy";
import type { CategoryIconName } from "../types/category";

export const CATEGORY_CUSTOMIZATION_STORAGE_KEY = "moneychecks.category-customization.v1";
export const CUSTOM_CATEGORY_ID_PREFIX = "custom-category";
export const CUSTOM_CATEGORY_DEFAULT_ICON: CategoryIconName = "circle";
export const CUSTOM_CATEGORY_MAX_NAME_LENGTH = 12;

export const CategoryCustomizerCopy = selectStaticCopy({
  en: {
    duplicateError: "This category name is already in use.",
    emptyError: "Enter a category name.",
    inlineAddAccessibilityLabel: "Add category",
    inlineIconAccessibilityLabel: "Change category icon",
    namePlaceholder: "Category name",
    newCategoryNamePrefix: "New Category",
  },
  ko: {
    duplicateError: "같은 분류 이름은 사용할 수 없어요.",
    emptyError: "분류 이름을 입력해 주세요.",
    inlineAddAccessibilityLabel: "분류 추가",
    inlineIconAccessibilityLabel: "분류 아이콘 변경",
    namePlaceholder: "분류 이름",
    newCategoryNamePrefix: "새 분류",
  },
} as const);
