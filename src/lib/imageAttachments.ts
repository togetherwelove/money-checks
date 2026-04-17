import * as ImagePicker from "expo-image-picker";

type ImageAttachment = {
  fileName: string;
  mimeType: string | null;
  uri: string;
};

export type PickImageAttachmentsOptions = {
  selectionLimit: number;
};

const imageAttachmentMediaTypes: ImagePicker.ImagePickerOptions["mediaTypes"] = ["images"];

export async function pickImageAttachments(
  options: PickImageAttachmentsOptions,
): Promise<ImageAttachment[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: true,
    mediaTypes: imageAttachmentMediaTypes,
    quality: 0.8,
    selectionLimit: options.selectionLimit,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset, index) => ({
    fileName: asset.fileName ?? `attachment-${index + 1}.jpg`,
    mimeType: asset.mimeType ?? null,
    uri: asset.uri,
  }));
}
