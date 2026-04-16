import { useEffect, useState } from "react";

import { LedgerBookNicknameCopy } from "../constants/ledgerBookNickname";
import { showNativeToast } from "../lib/nativeToast";
import type { LedgerBook } from "../types/ledgerBook";

type UseLedgerBookNicknameParams = {
  activeBook: LedgerBook | null;
  canEditBookName: boolean;
  onSaveBookName: (nextName: string) => Promise<boolean>;
};

export function useLedgerBookNickname({
  activeBook,
  canEditBookName,
  onSaveBookName,
}: UseLedgerBookNicknameParams) {
  const [bookNameInput, setBookNameInput] = useState("");

  useEffect(() => {
    setBookNameInput(activeBook?.name ?? "");
  }, [activeBook?.name]);

  const handleChangeBookName = (value: string) => {
    setBookNameInput(value);
  };

  const handleSaveBookName = async () => {
    if (!activeBook || !canEditBookName) {
      return false;
    }

    const didSave = await onSaveBookName(bookNameInput);
    showNativeToast(
      didSave ? LedgerBookNicknameCopy.saveSuccess : LedgerBookNicknameCopy.saveError,
    );
    return didSave;
  };

  return {
    bookNameInput,
    displayedBookName: activeBook?.name ?? null,
    canEditBookName,
    handleChangeBookName,
    handleSaveBookName,
  };
}
