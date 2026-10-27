
const CardSmsClipboardLocalizedCopy = {
    applyAction: "불러오기",
    amountCurrencySuffix: "원",
    dateDaysAgoSuffix: "일 전",
    dateDaysLaterPrefix: "",
    dateDaysLaterSuffix: "일 후",
    directEntryAction: "직접 등록",
    fallbackDateLabel: "날짜 없음",
    todayDateLabel: "오늘",
    tomorrowDateLabel: "내일",
    yesterdayDateLabel: "어제",
  } as const;

export const CardSmsClipboardCopy = {
  suggestionQuestion: "복사한 내역을 불러올까요?",
  showSuggestion: "클립보드 내역 확인",
  noAvailableEntry: "불러올 수 있는 복사한 내역이 없어요.",
  dismissSuggestion: "복사한 내역 제안 닫기",
  replaceTitle: "작성 중인 내역을 바꿀까요?",
  replaceMessage: "현재 입력한 정보 대신 클립보드에서 불러온 내역을 넣습니다.",
  keepAction: "기존 입력 유지",
  replaceAction: "바꾸기",
  ...CardSmsClipboardLocalizedCopy,
  actionPreviewContentMaxLength: 12,
  dateDisplaySeparator: "/",
  actionPreviewSuffix: "",
  previewOmissionIndicator: "...",
  previewSeparator: " · ",
} as const;

export const ClipboardPromptUi = {
  animationDurationMs: 280,
  buttonCollapsedScale: 0.7,
  revealProgress: 0.25,
  cornerRadius: 20,
} as const;
