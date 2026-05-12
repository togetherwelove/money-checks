import { selectStaticCopy } from "../i18n/staticCopy";

const HANGUL_SYLLABLE_START_CODE = "가".charCodeAt(0);
const HANGUL_SYLLABLE_END_CODE = "힣".charCodeAt(0);
const HANGUL_FINAL_CONSONANT_COUNT = 28;
const HANGUL_RIEUL_FINAL_CONSONANT_INDEX = 8;

export const SharedLedgerInviteMessages = selectStaticCopy({
  en: {
    buildInviteMessage: (bookName: string) => `${bookName} invites you.`,
    codeLabel: "Share code",
  },
  ko: {
    buildInviteMessage: (bookName: string) =>
      `${bookName}${resolveKoreanDirectionPostposition(bookName)} 초대합니다.`,
    codeLabel: "공유코드",
  },
} as const);

function resolveKoreanDirectionPostposition(value: string): "로" | "으로" {
  const lastCharacter = value.trim().at(-1);
  if (!lastCharacter) {
    return "로";
  }

  const characterCode = lastCharacter.charCodeAt(0);
  if (characterCode < HANGUL_SYLLABLE_START_CODE || characterCode > HANGUL_SYLLABLE_END_CODE) {
    return "로";
  }

  const finalConsonantIndex =
    (characterCode - HANGUL_SYLLABLE_START_CODE) % HANGUL_FINAL_CONSONANT_COUNT;
  if (finalConsonantIndex === 0 || finalConsonantIndex === HANGUL_RIEUL_FINAL_CONSONANT_INDEX) {
    return "로";
  }

  return "으로";
}
