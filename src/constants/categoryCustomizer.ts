import type { CategoryIconName } from "../types/category";

export const CATEGORY_CUSTOMIZATION_STORAGE_KEY = "moneychecks.category-customization.v1";
export const CUSTOM_CATEGORY_ID_PREFIX = "custom-category";
export const CUSTOM_CATEGORY_DEFAULT_ICON: CategoryIconName = "circle";
export const CUSTOM_CATEGORY_MAX_NAME_LENGTH = 12;

export const CategoryCustomizerCopy = {
  duplicateError:
    "\uAC19\uC740 \uBD84\uB958 \uC774\uB984\uC740 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC5B4\uC694.",
  emptyError: "\uBD84\uB958 \uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  inlineAddAccessibilityLabel: "\uBD84\uB958 \uCD94\uAC00",
  inlineIconAccessibilityLabel: "\uBD84\uB958 \uC544\uC774\uCF58 \uBCC0\uACBD",
  namePlaceholder: "\uBD84\uB958 \uC774\uB984",
  newCategoryNamePrefix: "\uC0C8 \uBD84\uB958",
} as const;
