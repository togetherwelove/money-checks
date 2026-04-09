import { describe, expect, it } from "vitest";

import { normalizeLedgerBookNickname, resolveOwnedLedgerBookName } from "./ledgerBookNickname";

describe("ledgerBookNicknameStorage", () => {
  it("normalizes repeated whitespace in nicknames", () => {
    expect(normalizeLedgerBookNickname("  나의   가계부  ")).toBe("나의 가계부");
  });

  it("falls back to the default owner ledger book name", () => {
    expect(resolveOwnedLedgerBookName("")).toBe("나의 가계부");
    expect(resolveOwnedLedgerBookName(null)).toBe("나의 가계부");
  });
});
