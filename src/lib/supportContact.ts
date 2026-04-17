import * as MailComposer from "expo-mail-composer";

import { SupportContactCopy } from "../constants/supportContact";
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
    throw new Error(SupportContactCopy.mailUnavailableError);
  }

  await MailComposer.composeAsync({
    attachments: attachments.map((attachment) => attachment.uri),
    body: [`가입 이메일: ${userEmail}`, "", body].join("\n"),
    recipients: [SupportContactCopy.developerEmail],
    subject,
  });
}
