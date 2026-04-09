import { LedgerBookNicknameCopy } from "../constants/ledgerBookNickname";

export function normalizeLedgerBookNickname(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function resolveOwnedLedgerBookName(storedNickname: string | null): string {
  const normalizedNickname = normalizeLedgerBookNickname(storedNickname ?? "");
  return normalizedNickname || LedgerBookNicknameCopy.defaultName;
}
