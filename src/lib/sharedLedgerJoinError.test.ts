import { AppMessages } from "../constants/messages";
import { ShareLedgerMessages } from "../constants/shareLedgerMessages";
import { resolveSharedLedgerJoinErrorMessage } from "./sharedLedgerJoinError";

describe("resolveSharedLedgerJoinErrorMessage", () => {
  it("maps known shared-ledger errors to specific Korean messages", () => {
    expect(
      resolveSharedLedgerJoinErrorMessage({
        message: "This share code has expired.",
      }),
    ).toBe(ShareLedgerMessages.joinExpiredCodeError);

    expect(
      resolveSharedLedgerJoinErrorMessage({
        details: "This join request is cooling down.",
      }),
    ).toBe(ShareLedgerMessages.joinCooldownError);
  });

  it("falls back to the generic join error for unknown cases", () => {
    expect(
      resolveSharedLedgerJoinErrorMessage({
        message: "Something unexpected happened.",
      }),
    ).toBe(AppMessages.accountJoinError);
  });
});
