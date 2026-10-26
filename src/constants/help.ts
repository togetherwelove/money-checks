import { AppLinks } from "./appLinks";
import { LegalLinks } from "./legal";

export const HelpCopy = {
  faqTitle: "자주 묻는 질문",
  faqDescription: "궁금한 질문을 누르면 답변을 확인할 수 있어요.",
  faqLinkDescription: "기록 입력, 공유, 구독 등 자주 묻는 질문과 답변",
  linksTitle: "안내 및 정책",
  linksDescription: "사용 안내와 서비스 정책을 확인할 수 있어요.",
  linkError: "링크를 열지 못했어요. 다시 시도해 주세요.",
  moreHelp: "궁금한 내용이 없다면 메뉴의 ‘개발자 문의’를 이용해 주세요.",
} as const;

export const HelpUi = {
  iconSize: 18,
  rowVerticalPadding: 16,
  questionFontSize: 15,
} as const;

export const HelpLinkItems = [
  { label: "알뜰 홈페이지", description: "공지, 사용 안내, 업데이트 소식을 확인할 수 있어요", url: AppLinks.homepageUrl },
  { label: "오픈소스 라이선스", description: "앱에서 사용하는 오픈소스 소프트웨어 고지", url: LegalLinks.openSourceLicensesUrl },
  { label: "개인정보 처리방침", description: "개인정보 수집, 이용, 보관 및 권리 안내", url: LegalLinks.privacyPolicyUrl },
  { label: "이용약관", description: "서비스 이용 조건, 구독 및 책임 범위 안내", url: LegalLinks.termsOfUseUrl },
] as const;
