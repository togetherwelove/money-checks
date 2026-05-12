import type { LedgerBookMember } from "../types/ledgerBookMember";

const membersByBookId = new Map<string, LedgerBookMember[]>();

export function readCachedLedgerBookMembers(bookId: string): LedgerBookMember[] | null {
  const members = membersByBookId.get(bookId);
  return members ? [...members] : null;
}

export function writeCachedLedgerBookMembers(bookId: string, members: readonly LedgerBookMember[]) {
  membersByBookId.set(bookId, [...members]);
}
