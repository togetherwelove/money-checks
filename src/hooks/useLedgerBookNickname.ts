import { useEffect, useMemo, useState } from "react";

import { LedgerBookNicknameCopy } from "../constants/ledgerBookNickname";
import { resolveOwnedLedgerBookName } from "../lib/ledgerBookNickname";
import { loadLedgerBookNickname, saveLedgerBookNickname } from "../lib/ledgerBookNicknameStorage";
import type { LedgerBook } from "../types/ledgerBook";

type UseLedgerBookNicknameParams = {
  activeBook: LedgerBook | null;
  currentUserId: string;
};

export function useLedgerBookNickname({ activeBook, currentUserId }: UseLedgerBookNicknameParams) {
  const [bookNameInput, setBookNameInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isOwner = Boolean(activeBook && activeBook.ownerId === currentUserId);

  useEffect(() => {
    if (!activeBook) {
      setBookNameInput("");
      setStatusMessage(null);
      return;
    }

    if (!isOwner) {
      setBookNameInput(activeBook.name);
      setStatusMessage(null);
      return;
    }

    setBookNameInput(resolveOwnedLedgerBookName(loadLedgerBookNickname(activeBook.id)));
    setStatusMessage(null);
  }, [activeBook, isOwner]);

  const displayedBookName = useMemo(() => {
    if (!activeBook) {
      return null;
    }

    if (!isOwner) {
      return activeBook.name;
    }

    return resolveOwnedLedgerBookName(bookNameInput);
  }, [activeBook, bookNameInput, isOwner]);

  const handleChangeBookName = (value: string) => {
    setBookNameInput(value);
    if (statusMessage) {
      setStatusMessage(null);
    }
  };

  const handleSaveBookName = () => {
    if (!activeBook || !isOwner) {
      return;
    }

    const savedBookName = saveLedgerBookNickname(activeBook.id, bookNameInput);
    setBookNameInput(savedBookName);
    setStatusMessage(LedgerBookNicknameCopy.saveSuccess);
  };

  return {
    bookNameInput,
    displayedBookName,
    isOwner,
    statusMessage,
    handleChangeBookName,
    handleSaveBookName,
  };
}
