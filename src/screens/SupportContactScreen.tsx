import { AppFontSize } from "../constants/typography";
import { useSupportContactHeader } from "../hooks/useSupportContactHeader";
import { useSupportContactDraft } from "../hooks/useSupportContactDraft";
import { AppLayout } from "../constants/layout";
import { BottomContentInsetContext } from "../contexts/BottomContentInsetContext";
import { SettingsGroup } from "../components/appSettings/SettingsGroup";
import { getSettingsGroupStyles, SettingsGroupDesign } from "../constants/settingsGroupStyles";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import type { ReactNode } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppScrollBehavior } from "../constants/scroll";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { IconActionButton } from "../components/IconActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { TextLinkButton } from "../components/TextLinkButton";
import { getAppColors } from "../constants/colors";
import { getSupportingTextStyle } from "../constants/uiStyles";

type SupportContactScreenProps = {
  email: string;
  screenTitle: ReactNode;
};

export function SupportContactScreen({ email, screenTitle }: SupportContactScreenProps) {
  const styles = getStyles();
  useAppTheme();
  const {
    attachments,
    subject,
    messageBody,
    setSubject,
    setMessageBody,
    removeAttachment,
    handlePickAttachments,
    handleSendSupportMail,
    isBusy,
  } = useSupportContactDraft(email);
  useSupportContactHeader(
    handleSendSupportMail,
    !isBusy && Boolean(subject.trim() && messageBody.trim()),
  );

  return (
    <BottomContentInsetContext.Provider value={AppLayout.cardContentPadding}>
      <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
        {screenTitle}
        <View style={getSettingsGroupStyles().sections}>
          <SettingsGroup>
            <View style={getSettingsGroupStyles().row}>
              <Text style={getSettingsGroupStyles().label}>가입 이메일</Text>
              <Text
                selectable
                numberOfLines={1}
                ellipsizeMode="middle"
                accessibilityLabel={email}
                style={styles.emailValue}
              >
                {email}
              </Text>
            </View>
          </SettingsGroup>
          <SettingsGroup>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>제목</Text>
              <TextInput
                editable={!isBusy}
                placeholderTextColor={getAppColors().mutedStrongText}
                onChangeText={setSubject}
                placeholder="문의 제목을 입력해 주세요"
                style={styles.input}
                value={subject}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>내용</Text>
              <TextInput
                editable={!isBusy}
                multiline
                placeholderTextColor={getAppColors().mutedStrongText}
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
                    disabled={isBusy}
                    accessibilityLabel="사진 고르기"
                    icon="paperclip"
                    onPress={handlePickAttachments}
                    size="compact"
                  />
                </View>
                <Text style={styles.attachmentCount}>{`첨부 ${attachments.length}개`}</Text>
              </View>
              {attachments.length > 0 ? (
                <ScrollView
                  {...AppScrollBehavior}
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
                        disabled={isBusy}
                        onPress={() => removeAttachment(attachment.uri)}
                      />
                    </View>
                  ))}
                </ScrollView>
              ) : null}
            </View>
          </SettingsGroup>
        </View>
        <AppFooterContentInset />
      </KeyboardAwareScrollView>
    </BottomContentInsetContext.Provider>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: getAppColors().screenBackground,
    },
    content: {
      ...getSettingsGroupStyles().page,
      flexGrow: 1,
    },
    fieldGroup: getSettingsGroupStyles().field,
    label: getSettingsGroupStyles().description,
    input: getSettingsGroupStyles().input,
    bodyInput: {
      ...getSettingsGroupStyles().input,
      minHeight: SettingsGroupDesign.multilineMinHeight,
    },
    emailValue: { ...getSettingsGroupStyles().value, flex: 1, minWidth: 0, textAlign: "right" },
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
      ...getSupportingTextStyle(),
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
      borderRadius: 8,
      backgroundColor: getAppColors().surfaceMuted,
    },
    attachmentName: {
      color: getAppColors().text,
      fontSize: AppFontSize.caption,
      fontWeight: "600",
    },
  }),
);
