import { type Action, SaveFormat, manipulateAsync } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import {
  ENTRY_PHOTO_COMPRESSION_QUALITY,
  ENTRY_PHOTO_MAX_PIXEL_LENGTH,
} from "../constants/entryPhotos";

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

  return Promise.all(result.assets.map(normalizeImageAttachment));
}

async function normalizeImageAttachment(
  asset: ImagePicker.ImagePickerAsset,
  index: number,
): Promise<ImageAttachment> {
  const result = await manipulateAsync(asset.uri, buildResizeActions(asset), {
    compress: ENTRY_PHOTO_COMPRESSION_QUALITY,
    format: SaveFormat.JPEG,
  });

  return {
    fileName: resolveJpegFileName(asset.fileName, index),
    mimeType: "image/jpeg",
    uri: result.uri,
  };
}

function buildResizeActions(asset: ImagePicker.ImagePickerAsset): Action[] {
  const longestSide = Math.max(asset.width, asset.height);
  if (longestSide <= ENTRY_PHOTO_MAX_PIXEL_LENGTH) {
    return [];
  }

  if (asset.width >= asset.height) {
    return [{ resize: { width: ENTRY_PHOTO_MAX_PIXEL_LENGTH } }];
  }

  return [{ resize: { height: ENTRY_PHOTO_MAX_PIXEL_LENGTH } }];
}

function resolveJpegFileName(fileName: string | null | undefined, index: number): string {
  const fallbackFileName = `attachment-${index + 1}.jpg`;
  if (!fileName?.trim()) {
    return fallbackFileName;
  }

  return `${fileName.replace(/\.[^.]+$/, "")}.jpg`;
}
