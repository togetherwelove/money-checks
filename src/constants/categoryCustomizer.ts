import type { CategoryIconName } from "../types/category";

export const CATEGORY_CUSTOMIZATION_STORAGE_KEY = "moneychecks.category-customization.v1";
export const CUSTOM_CATEGORY_ID_PREFIX = "custom-category";
export const CUSTOM_CATEGORY_DEFAULT_ICON: CategoryIconName = "circle";
export const CUSTOM_CATEGORY_MAX_NAME_LENGTH = 12;

export const CategoryCustomizerCopy = {
    saveAction: "저장",
    discardOrderTitle: "순서 변경 취소",
    discardOrderMessage: "저장하지 않은 순서 변경을 취소하고 다른 탭으로 이동할까요?",
    keepEditingAction: "계속 편집",
    switchTabAction: "이동",
    saveError: "분류를 저장하지 못했어요. 연결과 편집 권한을 확인한 뒤 다시 시도해 주세요.",
    loadingCategories: "기존 분류를 불러오는 중이에요.",
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
  } as const;

export const CategoryContextMenuCopy = {
    deleteConfirmMessage: "이 분류를 삭제할까요?",
    deleteConfirmTitle: "분류 삭제",
    editAction: "수정",
    editModalTitle: "분류 수정",
  } as const;
