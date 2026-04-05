import type { LedgerBook } from "../../types/ledgerBook";
import type { LedgerBookMember } from "../../types/ledgerBookMember";
import { isJoinRequestBlockedByActiveSharedLedger } from "./joinRequestBlock";

const sharedBook: LedgerBook = {
  id: "book-1",
  name: "함께 쓰는 가계부",
  ownerId: "owner-1",
  shareCode: "ABC12345DEF67890",
};

function createMembers(currentRole: LedgerBookMember["role"]): LedgerBookMember[] {
  return [
    {
      displayName: "나",
      role: currentRole,
      userId: "me",
    },
    {
      displayName: "다른 멤버",
      role: "owner",
      userId: "owner-1",
    },
  ];
}

describe("isJoinRequestBlockedByActiveSharedLedger", () => {
  it("blocks owners and editors in a shared ledger", () => {
    expect(
      isJoinRequestBlockedByActiveSharedLedger({
        activeBook: sharedBook,
        currentUserId: "me",
        members: createMembers("owner"),
      }),
    ).toBe(true);

    expect(
      isJoinRequestBlockedByActiveSharedLedger({
        activeBook: sharedBook,
        currentUserId: "me",
        members: createMembers("editor"),
      }),
    ).toBe(true);
  });

  it("allows viewers and personal-ledger users", () => {
    expect(
      isJoinRequestBlockedByActiveSharedLedger({
        activeBook: sharedBook,
        currentUserId: "me",
        members: createMembers("viewer"),
      }),
    ).toBe(false);

    expect(
      isJoinRequestBlockedByActiveSharedLedger({
        activeBook: sharedBook,
        currentUserId: "me",
        members: [
          {
            displayName: "나",
            role: "owner",
            userId: "me",
          },
        ],
      }),
    ).toBe(false);
  });
});
