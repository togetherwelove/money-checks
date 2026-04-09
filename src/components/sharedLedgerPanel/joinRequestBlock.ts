import type { LedgerBook } from "../../types/ledgerBook";
import type { LedgerBookMember } from "../../types/ledgerBookMember";

type JoinRequestBlockParams = {
  activeBook: LedgerBook | null;
  currentUserId: string;
  members: LedgerBookMember[];
};

export function isJoinRequestBlockedByActiveSharedLedger({
  activeBook,
  currentUserId,
  members,
}: JoinRequestBlockParams): boolean {
  if (!activeBook) {
    return false;
  }

  const currentMember = members.find((member) => member.userId === currentUserId);
  if (!currentMember) {
    return false;
  }

  const hasOtherMember = members.some((member) => member.userId !== currentUserId);
  if (!hasOtherMember) {
    return false;
  }

  return currentMember.role === "owner" || currentMember.role === "editor";
}
