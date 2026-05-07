import { selectStaticCopy } from "../i18n/staticCopy";

export const CommonActionCopy = selectStaticCopy({
  en: {
    apply: "Apply",
    cancel: "Cancel",
    close: "Close",
    confirm: "OK",
    copy: "Copy",
    save: "Save",
  },
  ko: {
    apply: "적용",
    cancel: "취소",
    close: "닫기",
    confirm: "확인",
    copy: "복사",
    save: "저장",
  },
} as const);
