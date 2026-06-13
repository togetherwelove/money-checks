import * as MailComposer from "expo-mail-composer";

import { pickImageAttachments } from "./imageAttachments";

export type SupportAttachment = {
  fileName: string;
  uri: string;
};

export async function pickSupportAttachments(): Promise<SupportAttachment[]> {
  const attachments = await pickImageAttachments({ selectionLimit: 5 });
  return attachments.map((attachment) => ({
    fileName: attachment.fileName,
    uri: attachment.uri,
  }));
}

export async function composeSupportMail({
  attachments,
  body,
  userEmail,
  subject,
}: {
  attachments: SupportAttachment[];
  body: string;
  userEmail: string;
  subject: string;
}) {
  const isAvailable = await MailComposer.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("이 기기에서는 메일 앱을 사용할 수 없어요.");
  }

  await MailComposer.composeAsync({
    attachments: attachments.map((attachment) => attachment.uri),
    body: [`가입 이메일: ${userEmail}`, "", body].join("\n"),
    recipients: ["rkdcksdnr1@gmail.com"],
    subject,
  });
}
