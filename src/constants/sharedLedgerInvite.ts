import { selectStaticCopy } from "../i18n/staticCopy";

export const SharedLedgerInviteConfig = {
  appStoreUrl: "https://apps.apple.com/kr/app/id6762341315",
} as const;

export const SharedLedgerInviteMessages = selectStaticCopy({
  en: {
    appLinkLabel: "Install Alttle",
    codeLabel: "Share code",
  },
  ko: {
    appLinkLabel: "알뜰 설치하기",
    codeLabel: "공유코드",
  },
} as const);
