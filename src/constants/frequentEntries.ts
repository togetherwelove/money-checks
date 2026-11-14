export const FrequentEntryCopy = {
  title: "자주 쓰는 내역",
  add: "자주 쓰는 내역에 추가",
  added: "자주 쓰는 내역에 추가했어요.",
  exists: "이미 추가한 내역이에요.",
  error: "자주 쓰는 내역을 저장하지 못했어요. 다시 시도해 주세요.",
  empty: "내역을 길게 눌러 자주 쓰는 내역에 추가할 수 있어요.",
  use: "불러오기",
  remove: "목록에서 제거",
  removed: "목록에서 제거했어요.",
} as const;

export const FrequentEntryConfig = {
  storagePrefix: "frequent-entries:v1",
  separator: " · ",
  addIcon: "star",
  useActionPrefix: "use:",
  removeActionPrefix: "remove:",
  entryActionPrefix: "entry:",
  emptyAction: "empty",
} as const;
