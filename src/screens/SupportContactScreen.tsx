import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { IconActionButton } from "../components/IconActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { TextLinkButton } from "../components/TextLinkButton";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import {
  CompactLabelTextStyle,
  FormInputTextStyle,
  FormMultilineInputTextStyle,
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
      showNativeToast("사진을 불러오지 못했어요.");
    }
  };

  const handleSendSupportMail = async () => {
    if (!subject.trim()) {
      showNativeToast("문의 제목을 입력해 주세요.");
      return;
    }

    if (!messageBody.trim()) {
      showNativeToast("문의 내용을 입력해 주세요.");
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
      showNativeToast(error instanceof Error ? error.message : "문의 메일을 준비하지 못했어요.");
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>가입 이메일</Text>
          <Text style={styles.emailValue}>{email}</Text>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            onChangeText={setSubject}
            placeholder="문의 제목을 입력해 주세요"
            style={styles.input}
            value={subject}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>내용</Text>
          <TextInput
            multiline
            onChangeText={setMessageBody}
            placeholder="문제 상황이나 개선 요청을 자세히 적어 주세요"
            style={[styles.input, styles.bodyInput]}
            textAlignVertical="top"
            value={messageBody}
          />
        </View>
        <View style={styles.fieldGroup}>
          <View style={styles.attachmentHeader}>
            <View style={styles.attachmentHeaderInfo}>
              <IconActionButton
                accessibilityLabel="사진 고르기"
                icon="paperclip"
                onPress={handlePickAttachments}
                size="compact"
              />
            </View>
            <Text style={styles.attachmentCount}>
              {`첨부 ${attachments.length}개`}
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
                    label="삭제"
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
          label="메일 전송하기"
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
    flexGrow: 1,
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenTopPadding,
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
    ...FormMultilineInputTextStyle,
    height: 144,
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
