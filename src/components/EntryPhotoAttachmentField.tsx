import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import {
  ENTRY_PHOTO_CARD_GAP,
  ENTRY_PHOTO_CARD_MARGIN,
  ENTRY_PHOTO_PREVIEW_BORDER_RADIUS,
  ENTRY_PHOTO_PREVIEW_PADDING,
  ENTRY_PHOTO_THUMBNAIL_SIZE,
  EntryPhotoCopy,
} from "../constants/entryPhotos";
import {
  CompactLabelTextStyle,
  FormLabelTextStyle,
  SupportingTextStyle,
} from "../constants/uiStyles";
import type { LedgerEntryPhotoAttachment } from "../types/ledger";
import { IconActionButton } from "./IconActionButton";
import { TextLinkButton } from "./TextLinkButton";

type EntryPhotoAttachmentFieldProps = {
  attachments: LedgerEntryPhotoAttachment[];
  onPickAttachments: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
};

export function EntryPhotoAttachmentField({
  attachments,
  onPickAttachments,
  onRemoveAttachment,
}: EntryPhotoAttachmentFieldProps) {
  const [previewAttachmentUri, setPreviewAttachmentUri] = useState<string | null>(null);

  return (
    <>
      <View style={styles.fieldGroup}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.label}>{EntryPhotoCopy.fieldLabel}</Text>
            <IconActionButton
              accessibilityLabel={EntryPhotoCopy.addPhotoAction}
              icon="paperclip"
              onPress={onPickAttachments}
              size="compact"
            />
          </View>
          <Text style={styles.attachmentCount}>
            {EntryPhotoCopy.attachmentCountLabel(attachments.length)}
          </Text>
        </View>
        {attachments.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.attachmentList}
          >
            {attachments.map((attachment) => {
              const attachmentId = attachment.id ?? attachment.uri;
              return (
                <View key={attachmentId} style={styles.attachmentCard}>
                  <Pressable onPress={() => setPreviewAttachmentUri(attachment.uri)}>
                    <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                  </Pressable>
                  <Text numberOfLines={1} style={styles.attachmentName}>
                    {attachment.fileName}
                  </Text>
                  <TextLinkButton
                    label={EntryPhotoCopy.removeAttachmentAction}
                    onPress={() => onRemoveAttachment(attachmentId)}
                  />
                </View>
              );
            })}
          </ScrollView>
        ) : null}
      </View>
      <Modal
        animationType="fade"
        onRequestClose={() => setPreviewAttachmentUri(null)}
        transparent
        visible={Boolean(previewAttachmentUri)}
      >
        <Pressable onPress={() => setPreviewAttachmentUri(null)} style={styles.previewBackdrop}>
          {previewAttachmentUri ? (
            <Image source={{ uri: previewAttachmentUri }} style={styles.previewImage} />
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: FormLabelTextStyle,
  attachmentCount: {
    ...SupportingTextStyle,
    flexShrink: 1,
  },
  attachmentList: {
    marginHorizontal: -ENTRY_PHOTO_CARD_MARGIN,
  },
  attachmentCard: {
    width: ENTRY_PHOTO_THUMBNAIL_SIZE,
    marginHorizontal: ENTRY_PHOTO_CARD_MARGIN,
    gap: ENTRY_PHOTO_CARD_GAP,
  },
  attachmentImage: {
    width: "100%",
    height: ENTRY_PHOTO_THUMBNAIL_SIZE,
    borderRadius: 14,
    backgroundColor: AppColors.surfaceMuted,
  },
  attachmentName: {
    ...CompactLabelTextStyle,
    color: AppColors.text,
  },
  previewBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ENTRY_PHOTO_PREVIEW_PADDING,
    backgroundColor: AppColors.overlay,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: ENTRY_PHOTO_PREVIEW_BORDER_RADIUS,
    resizeMode: "contain",
  },
});
