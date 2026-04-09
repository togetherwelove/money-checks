import type { CategoryIconName } from "../types/category";

export const CATEGORY_CUSTOMIZATION_STORAGE_KEY = "moneychecks.category-customization.v1";
export const CUSTOM_CATEGORY_ID_PREFIX = "custom-category";
export const CUSTOM_CATEGORY_DEFAULT_ICON: CategoryIconName = "circle";
export const CUSTOM_CATEGORY_MAX_NAME_LENGTH = 12;

export const CategoryCustomizerCopy = {
  addButton: "\uBD84\uB958 \uCD94\uAC00",
  addTileAccessibilityLabel: "\uCEE4\uC2A4\uD140 \uBD84\uB958 \uAD00\uB9AC",
  description:
    "\uC544\uC774\uCF58\uACFC \uC774\uB984\uC744 \uC815\uD558\uACE0, \uC21C\uC11C\uB97C \uC815\uB9AC\uD558\uC138\uC694.",
  duplicateError:
    "\uAC19\uC740 \uBD84\uB958 \uC774\uB984\uC740 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC5B4\uC694.",
  deleteAccessibilityLabel: "\uBD84\uB958 \uC0AD\uC81C",
  emptyError: "\uBD84\uB958 \uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  iconPickerTitle: "\uC544\uC774\uCF58 \uC120\uD0DD",
  modalTitle: "\uBD84\uB958 \uAD00\uB9AC",
  namePlaceholder: "\uBD84\uB958 \uC774\uB984",
  newCategoryNamePrefix: "\uC0C8 \uBD84\uB958",
  reorderHandleAccessibilityLabel: "\uC21C\uC11C \uC774\uB3D9",
} as const;

export const CATEGORY_CUSTOMIZER_ROW_HEIGHT = 48;
export const CATEGORY_CUSTOMIZER_ROW_GAP = 6;
export const CATEGORY_CUSTOMIZER_ICON_BUTTON_SIZE = 32;
export const CATEGORY_CUSTOMIZER_HANDLE_SIZE = 32;
export const CATEGORY_CUSTOMIZER_ICON_PICKER_GAP = 10;
export const CATEGORY_CUSTOMIZER_SECTION_GAP = 8;
export const CATEGORY_CUSTOMIZER_LIST_MAX_HEIGHT = 280;
export const CATEGORY_CUSTOMIZER_AUTO_SCROLL_EDGE_THRESHOLD = 44;
export const CATEGORY_CUSTOMIZER_AUTO_SCROLL_STEP = 18;
