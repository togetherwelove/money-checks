import type { LedgerAppScreen } from "../types/app";
import { HelpCopy } from "../constants/help";

export const AppScreenLabels: Record<LedgerAppScreen, string> = {
  account: "계정",
  "all-entries": "전체 내역",
  "all-menu": "전체",
  "app-settings": "화면·표시 설정",
  calendar: "가계부 달력",
  charts: "차트",
  "contact-support": "개발자 문의",
  entry: "입출금 등록",
  help: "도움말",
  "help-faq": HelpCopy.faqTitle,
  "notification-settings": "푸시 알림 설정",
  share: "가계부 공유",
  support: "개발자 후원",
  subscription: "알뜰 plus",
};

export function getAppScreenLabel(screen: LedgerAppScreen): string {
  return AppScreenLabels[screen];
}
