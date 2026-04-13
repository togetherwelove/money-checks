import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { IconActionButton } from "../components/IconActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { TextLinkButton } from "../components/TextLinkButton";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { SupportContactCopy } from "../constants/supportContact";
import {
  CompactLabelTextStyle,
  FormInputTextStyle,
  SupportingTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
import { showNativeToast } from "../lib/nativeToast";
import {
  type SupportAttachment,
  composeSupportMail,
  pickSupportAttachments,
} from "../lib/supportContact";

type SupportContactScreenProps = {
  email: string;
};

export function SupportContactScreen({ email }: SupportContactScreenProps) {
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [messageBody, setMessageBody] = useState("");
  const [subject, setSubject] = useState("");

  const handlePickAttachments = async () => {
    try {
      const nextAttachments = await pickSupportAttachments();
      if (nextAttachments.length > 0) {
        setAttachments((currentAttachments) => [...currentAttachments, ...nextAttachments]);
      }
    } catch {
      showNativeToast(SupportContactCopy.imagePickerError);
    }
  };

  const handleSendSupportMail = async () => {
    if (!subject.trim()) {
      showNativeToast(SupportContactCopy.emptySubjectError);
      return;
    }

    if (!messageBody.trim()) {
      showNativeToast(SupportContactCopy.emptyBodyError);
      return;
    }

    try {
      await composeSupportMail({
        attachments,
        body: messageBody.trim(),
        subject: subject.trim(),
        userEmail: email,
      });
    } catch (error) {
      showNativeToast(error instanceof Error ? error.message : SupportContactCopy.mailComposeError);
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{SupportContactCopy.senderEmailLabel}</Text>
          <Text style={styles.emailValue}>{email}</Text>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{SupportContactCopy.subjectLabel}</Text>
          <TextInput
            onChangeText={setSubject}
            placeholder={SupportContactCopy.subjectPlaceholder}
            style={styles.input}
            value={subject}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{SupportContactCopy.bodyLabel}</Text>
          <TextInput
            multiline
            onChangeText={setMessageBody}
            placeholder={SupportContactCopy.bodyPlaceholder}
            style={[styles.input, styles.bodyInput]}
            textAlignVertical="top"
            value={messageBody}
          />
        </View>
        <View style={styles.fieldGroup}>
          <View style={styles.attachmentHeader}>
            <View style={styles.attachmentHeaderInfo}>
              <IconActionButton
                accessibilityLabel={SupportContactCopy.attachmentAction}
                icon="paperclip"
                onPress={handlePickAttachments}
                size="compact"
              />
            </View>
            <Text style={styles.attachmentCount}>
              {SupportContactCopy.buildAttachmentCountLabel(attachments.length)}
            </Text>
          </View>
          {attachments.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.attachmentList}
            >
              {attachments.map((attachment) => (
                <View key={attachment.uri} style={styles.attachmentCard}>
                  <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                  <Text numberOfLines={1} style={styles.attachmentName}>
                    {attachment.fileName}
                  </Text>
                  <TextLinkButton
                    label={SupportContactCopy.removeAttachmentAction}
                    onPress={() =>
                      setAttachments((currentAttachments) =>
                        currentAttachments.filter(
                          (currentAttachment) => currentAttachment.uri !== attachment.uri,
                        ),
                      )
                    }
                  />
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
        <ActionButton
          label={SupportContactCopy.sendAction}
          onPress={handleSendSupportMail}
          variant="primary"
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
    paddingBottom: 24,
  },
  card: {
    ...SurfaceCardStyle,
    gap: AppLayout.cardGap,
  },
  fieldGroup: {
    gap: 6,
  },
  label: CompactLabelTextStyle,
  input: FormInputTextStyle,
  bodyInput: {
    minHeight: 144,
  },
  emailValue: {
    ...SupportingTextStyle,
    color: AppColors.text,
    fontWeight: "700",
  },
  attachmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  attachmentHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attachmentCount: {
    ...SupportingTextStyle,
    flexShrink: 1,
  },
  attachmentList: {
    marginHorizontal: -2,
  },
  attachmentCard: {
    width: 104,
    marginHorizontal: 2,
    gap: 4,
  },
  attachmentImage: {
    width: "100%",
    height: 104,
    borderRadius: 14,
    backgroundColor: AppColors.surfaceMuted,
  },
  attachmentName: {
    color: AppColors.text,
    fontSize: 11,
    fontWeight: "600",
  },
});
