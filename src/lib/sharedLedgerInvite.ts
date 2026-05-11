import {
  SharedLedgerInviteConfig,
  SharedLedgerInviteMessages,
} from "../constants/sharedLedgerInvite";

export function formatSharedLedgerInviteMessage(shareCode: string): string {
  return [
    `${SharedLedgerInviteMessages.codeLabel}: ${shareCode}`,
    `${SharedLedgerInviteMessages.appLinkLabel}: ${SharedLedgerInviteConfig.appStoreUrl}`,
  ].join("\n");
}
