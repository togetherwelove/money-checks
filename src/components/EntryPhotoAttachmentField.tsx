import { ComposerBlockingModal as Modal } from "./ComposerBlockingModal";
import { AppScrollBehavior } from "../constants/scroll";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { ModalCloseButtonUi } from "../constants/modal";
import { CompactTextProps } from "../constants/textLayout";
import { EntryDetailFieldStyle, EntryDetailLabelStyle, EntryDetailValueStyle, EntryDetailRowStyle } from "../constants/entryDetailStyles";
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
} from "../constants/uiStyles";
import type { LedgerEntryPhotoAttachment } from "../types/ledger";
import { IconActionButton } from "./IconActionButton";
import { ModalCloseButton } from "./ModalCloseButton";
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
  const insets = useSafeAreaInsets();

  return (
    <>
      <View style={styles.fieldGroup}>
        <View style={styles.header}>
          <Text {...CompactTextProps} style={styles.label}>{EntryPhotoCopy.fieldLabel}</Text>
          <View style={styles.headerInfo}>
            <Text {...CompactTextProps} style={styles.attachmentCount}>
              {EntryPhotoCopy.attachmentCountLabel(attachments.length)}
            </Text>
            <IconActionButton
              accessibilityLabel={EntryPhotoCopy.addPhotoAction}
              icon="paperclip"
              onPress={onPickAttachments}
              size="compact"
            />
          </View>
        </View>
        {attachments.length > 0 ? (
          <ScrollView {...AppScrollBehavior}
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
        <View style={styles.previewContainer}>
          <Pressable onPress={() => setPreviewAttachmentUri(null)} style={styles.previewBackdrop}>
            {previewAttachmentUri ? (
              <Image source={{ uri: previewAttachmentUri }} style={styles.previewImage} />
            ) : null}
          </Pressable>
          <View style={[styles.previewClose, {
            top: insets.top + AppLayout.screenPadding,
            right: insets.right + AppLayout.screenPadding,
          }]}>
            <ModalCloseButton onPress={() => setPreviewAttachmentUri(null)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fieldGroup: EntryDetailFieldStyle,
  header: EntryDetailRowStyle,
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: AppLayout.screenPadding,
  },
  label: EntryDetailLabelStyle,
  attachmentCount: {
    ...EntryDetailValueStyle,
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
    borderRadius: ENTRY_PHOTO_PREVIEW_BORDER_RADIUS,
    backgroundColor: AppColors.surfaceMuted,
  },
  attachmentName: {
    ...CompactLabelTextStyle,
    color: AppColors.text,
  },
  previewContainer: {
    flex: 1,
  },
  previewClose: {
    position: "absolute",
    backgroundColor: AppColors.surface,
    borderRadius: ModalCloseButtonUi.touchSize / 2,
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
