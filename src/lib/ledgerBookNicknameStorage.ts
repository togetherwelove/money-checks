import { appStorage } from "./appStorage";
import { resolveOwnedLedgerBookName } from "./ledgerBookNickname";

const LEDGER_BOOK_NICKNAME_STORAGE_KEY = "moneychecks.ledger-book-nickname.v1";

type StoredLedgerBookNicknames = Record<string, string>;

export function loadLedgerBookNickname(bookId: string): string | null {
  const storedNicknames = readStoredLedgerBookNicknames();
  return storedNicknames[bookId] ?? null;
}

export function saveLedgerBookNickname(bookId: string, nickname: string): string {
  const storedNicknames = readStoredLedgerBookNicknames();
  const nextNickname = resolveOwnedLedgerBookName(nickname);
  storedNicknames[bookId] = nextNickname;
  appStorage.setItem(LEDGER_BOOK_NICKNAME_STORAGE_KEY, JSON.stringify(storedNicknames));
  return nextNickname;
}

function readStoredLedgerBookNicknames(): StoredLedgerBookNicknames {
  const storedValue = appStorage.getItem(LEDGER_BOOK_NICKNAME_STORAGE_KEY);
  if (!storedValue) {
    return {};
  }

  try {
    return JSON.parse(storedValue) as StoredLedgerBookNicknames;
  } catch {
    return {};
  }
}
