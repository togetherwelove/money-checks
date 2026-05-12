import { SharedLedgerInviteMessages } from "../constants/sharedLedgerInvite";

export function formatSharedLedgerInviteMessage(bookName: string, shareCode: string): string {
  return [
    `${bookName}${SharedLedgerInviteMessages.inviteMessageSuffix}`,
    `${SharedLedgerInviteMessages.codeLabel}: ${shareCode}`,
  ].join("\n");
}
