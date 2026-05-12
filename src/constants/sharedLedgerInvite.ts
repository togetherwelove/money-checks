import { selectStaticCopy } from "../i18n/staticCopy";

export const SharedLedgerInviteMessages = selectStaticCopy({
  en: {
    codeLabel: "Share code",
    inviteMessageSuffix: "invites you.",
  },
  ko: {
    codeLabel: "공유코드",
    inviteMessageSuffix: "(으)로 초대합니다.",
  },
} as const);
