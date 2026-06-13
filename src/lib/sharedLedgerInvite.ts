import { SharedLedgerInviteMessages } from "../constants/sharedLedgerInvite";

export function formatSharedLedgerInviteMessage(bookName: string, shareCode: string): string {
  return [
    SharedLedgerInviteMessages.buildInviteMessage(bookName),
    `${SharedLedgerInviteMessages.codeLabel}: ${shareCode}`,
  ].join("\n");
}
