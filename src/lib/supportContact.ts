import * as ImagePicker from "expo-image-picker";
import * as MailComposer from "expo-mail-composer";

import { SupportContactCopy } from "../constants/supportContact";

export type SupportAttachment = {
  fileName: string;
  uri: string;
};

const supportAttachmentMediaTypes: ImagePicker.ImagePickerOptions["mediaTypes"] = ["images"];

export async function pickSupportAttachments(): Promise<SupportAttachment[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: true,
    mediaTypes: supportAttachmentMediaTypes,
    quality: 0.8,
    selectionLimit: 5,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset, index) => ({
    fileName: asset.fileName ?? `attachment-${index + 1}.jpg`,
    uri: asset.uri,
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
