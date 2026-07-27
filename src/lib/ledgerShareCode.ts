import { SHARE_CODE_LENGTH } from "../constants/ledgerDisplay";

const SHARE_CODE_WHITESPACE_PATTERN = /\s/g;
const SHARE_CODE_CHARACTER_PATTERN = /^[A-F0-9]+$/;

export function normalizeLedgerShareCode(value: string): string {
  return value
    .replace(SHARE_CODE_WHITESPACE_PATTERN, "")
    .toUpperCase()
    .slice(0, SHARE_CODE_LENGTH);
}

export function isValidLedgerShareCode(value: string): boolean {
  return value.length === SHARE_CODE_LENGTH && SHARE_CODE_CHARACTER_PATTERN.test(value);
}
