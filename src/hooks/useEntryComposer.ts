import { useEffect, useRef, useState } from "react";

import { ENTRY_PHOTO_LIMIT, EntryPhotoCopy } from "../constants/entryPhotos";
import { pickImageAttachments } from "../lib/imageAttachments";
import { fetchLedgerBookMembers } from "../lib/ledgerBooks";
import { logAppError } from "../lib/logAppError";
import { showNativeToast } from "../lib/nativeToast";
import type { LedgerEntryDraft } from "../types/ledger";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import { createDraft } from "../utils/ledgerEntries";

export function useEntryComposer(bookId: string | null, selectedDate: string, userId: string) {
  const [draft, setDraft] = useState(() => createDraft(selectedDate, userId));
  const [members, setMembers] = useState<LedgerBookMember[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (bookId) {
      void fetchLedgerBookMembers(bookId).then((nextMembers) => {
        if (!active) return;
        setMembers(nextMembers);
        setDraft((current) => {
          if ((current.amount || current.content) && !nextMembers.some((item) => item.userId === current.targetMemberId)) return current;
          const member = nextMembers.find((item) => item.userId === current.targetMemberId)
            ?? nextMembers.find((item) => item.userId === userId) ?? nextMembers[0];
          return member ? { ...current, targetMemberId: member.userId, targetMemberName: member.displayName } : current;
        });
      }).catch((error) => logAppError("EntryComposer", error, { step: "load_members" }));
    }
    return () => { active = false; };
  }, [bookId, userId]);

  useEffect(() => {
    setDraft((current) => current.amount || current.content ? current : { ...current, date: selectedDate });
  }, [selectedDate]);

  const update = <K extends keyof LedgerEntryDraft>(field: K, value: LedgerEntryDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };
  const pickPhotos = async () => {
    const remaining = ENTRY_PHOTO_LIMIT - draft.photoAttachments.length;
    if (remaining <= 0) {
      showNativeToast(EntryPhotoCopy.limitReachedError);
      return;
    }
    try {
      const photos = await pickImageAttachments({ selectionLimit: remaining });
      if (mounted.current && photos.length) {
        setDraft((current) => ({ ...current, photoAttachments: [...current.photoAttachments, ...photos].slice(0, ENTRY_PHOTO_LIMIT) }));
      }
    } catch {
      showNativeToast(EntryPhotoCopy.imagePickerError);
    }
  };
  const reset = () => {
    const member = members.find((item) => item.userId === userId) ?? members[0];
    setDraft({ ...createDraft(selectedDate, member?.userId ?? userId), targetMemberName: member?.displayName });
  };
  return { draft, members, pickPhotos, setDraft, update, reset };
}
