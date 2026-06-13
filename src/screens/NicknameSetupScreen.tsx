import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { ScreenHeaderBlock } from "../components/ScreenHeaderBlock";
import { TextLinkButton } from "../components/TextLinkButton";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import {
  FormInputTextStyle,
  StatusMessageTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
import { isApplePrivateRelayEmail } from "../lib/auth/applePrivateRelayEmail";
import { scheduleIdleTask } from "../lib/idleScheduler";
import { isValidDisplayName } from "../utils/displayName";

type NicknameSetupScreenProps = {
  accountEmail: string | null;
  onSwitchAccount: () => void;
  onSubmit: (displayName: string) => Promise<boolean>;
};

export function NicknameSetupScreen({
  accountEmail,
  onSubmit,
  onSwitchAccount,
}: NicknameSetupScreenProps) {
  const [displayName, setDisplayName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputInstanceKey, setInputInstanceKey] = useState(0);
  const [isInputReady, setIsInputReady] = useState(false);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const idleTask = scheduleIdleTask(() => {
      setInputInstanceKey(1);
      setIsInputReady(true);
    });

    return () => {
      idleTask.cancel();
    };
  }, []);

  useEffect(() => {
    if (!isInputReady) {
      return;
    }

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    return () => {
      clearTimeout(focusTimer);
    };
  }, [isInputReady]);

  const handleSubmit = async () => {
    const trimmedDisplayName = displayName.trim();
    if (!isValidDisplayName(trimmedDisplayName)) {
      setErrorMessage("이름을 저장하지 못했어요. 다시 시도해 주세요.");
      return;
    }

    const didComplete = await onSubmit(trimmedDisplayName);
    if (!didComplete) {
      setErrorMessage("이름을 저장하지 못했어요. 다시 시도해 주세요.");
    }
  };

  return (
    <KeyboardAwareScrollView
      centerContent
      contentContainerStyle={styles.content}
      style={styles.screen}
    >
      <ScreenHeaderBlock
        eyebrow="반갑습니다"
        title="이름을 설정해 주세요."
      />
      <View style={styles.card}>
        {accountEmail ? (
          <Text style={styles.accountDescription}>
            {`${isApplePrivateRelayEmail(accountEmail) ? "현재 Apple 비공개 이메일 " : "현재 "}${accountEmail} 계정으로 설정 중`}
          </Text>
        ) : null}
        <TextInput
          ref={inputRef}
          onChangeText={(value) => {
            setDisplayName(value);
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
          autoComplete="nickname"
          autoCorrect={false}
          editable={isInputReady}
          importantForAutofill="no"
          key={`nickname-input-${inputInstanceKey}`}
          placeholder="사용할 이름"
          style={styles.input}
          textContentType="none"
          value={displayName}
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <ActionButton
          label="다음"
          onPress={handleSubmit}
          variant="primary"
        />
      </View>
      <TextLinkButton
        align="center"
        label="다른 계정으로 로그인"
        onPress={onSwitchAccount}
      />
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
    gap: 12,
  },
  card: {
    ...SurfaceCardStyle,
    gap: 10,
  },
  input: FormInputTextStyle,
  accountDescription: {
    color: AppColors.mutedStrongText,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  errorText: {
    color: AppColors.expense,
    ...StatusMessageTextStyle,
  },
});
