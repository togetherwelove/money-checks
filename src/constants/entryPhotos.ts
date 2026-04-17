export const ENTRY_PHOTO_BUCKET = "receipt-files";
export const ENTRY_PHOTO_LIMIT = 5;
export const ENTRY_PHOTO_RANDOM_MAX = 1_000_000_000;
export const ENTRY_PHOTO_CARD_GAP = 4;
export const ENTRY_PHOTO_CARD_MARGIN = 2;
export const ENTRY_PHOTO_PREVIEW_BORDER_RADIUS = 24;
export const ENTRY_PHOTO_PREVIEW_PADDING = 24;
export const ENTRY_PHOTO_THUMBNAIL_SIZE = 104;
export const ENTRY_PHOTO_SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;
export const ENTRY_PHOTO_STORAGE_FOLDER = "ledger-entry-photos";

export const EntryPhotoCopy = {
  addPhotoAction: "사진 고르기",
  attachmentCountLabel: (count: number) => `첨부 ${count}개`,
  fieldLabel: "사진",
  imagePickerError: "사진을 불러오지 못했어요.",
  limitReachedError: `사진은 최대 ${ENTRY_PHOTO_LIMIT}장까지 첨부할 수 있어요.`,
  removeAttachmentAction: "삭제",
  saveError: "사진을 저장하지 못했어요.",
} as const;
