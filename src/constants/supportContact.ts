import { selectStaticCopy } from "../i18n/staticCopy";

const SupportContactLocalizedCopy = selectStaticCopy({
  en: {
    screenTitle: "Contact Developer",
    senderEmailLabel: "Account Email",
    subjectLabel: "Subject",
    subjectPlaceholder: "Enter a subject",
    bodyLabel: "Message",
    bodyPlaceholder: "Describe the issue or request in detail",
    attachmentAction: "Choose Photos",
    removeAttachmentAction: "Remove",
    sendAction: "Send Email",
    emptySubjectError: "Enter a subject.",
    emptyBodyError: "Enter a message.",
    imagePickerError: "Could not load photos.",
    mailUnavailableError: "Mail apps are unavailable on this device.",
    mailComposeError: "Could not prepare the support email.",
    buildAttachmentCountLabel: (count: number) => `${count} attached`,
  },
  ko: {
    screenTitle: "개발자 문의",
    senderEmailLabel: "가입 이메일",
    subjectLabel: "제목",
    subjectPlaceholder: "문의 제목을 입력해 주세요",
    bodyLabel: "내용",
    bodyPlaceholder: "문제 상황이나 개선 요청을 자세히 적어 주세요",
    attachmentAction: "사진 고르기",
    removeAttachmentAction: "삭제",
    sendAction: "메일 전송하기",
    emptySubjectError: "문의 제목을 입력해 주세요.",
    emptyBodyError: "문의 내용을 입력해 주세요.",
    imagePickerError: "사진을 불러오지 못했어요.",
    mailUnavailableError: "이 기기에서는 메일 앱을 사용할 수 없어요.",
    mailComposeError: "문의 메일을 준비하지 못했어요.",
    buildAttachmentCountLabel: (count: number) => `첨부 ${count}개`,
  },
} as const);

export const SupportContactCopy = {
  ...SupportContactLocalizedCopy,
  developerEmail: "rkdcksdnr1@gmail.com",
} as const;
