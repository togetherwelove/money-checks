import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { ScreenHeaderBlock } from "../components/ScreenHeaderBlock";
import { AuthOnboardingMessages } from "../constants/authOnboarding";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import {
  FormInputTextStyle,
  FormLabelTextStyle,
  StatusMessageTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
import { scheduleIdleTask } from "../lib/idleScheduler";
import { isValidDisplayName } from "../utils/displayName";

type NicknameSetupScreenProps = {
  onSubmit: (displayName: string) => Promise<boolean>;
};

export function NicknameSetupScreen({ onSubmit }: NicknameSetupScreenProps) {
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
      setErrorMessage(AuthOnboardingMessages.nicknameError);
      return;
    }

    const didComplete = await onSubmit(trimmedDisplayName);
    if (!didComplete) {
      setErrorMessage(AuthOnboardingMessages.nicknameError);
    }
  };

  return (
    <KeyboardAwareScrollView
      centerContent
      contentContainerStyle={styles.content}
      style={styles.screen}
    >
      <ScreenHeaderBlock
        eyebrow={AuthOnboardingMessages.nicknameEyebrow}
        title={AuthOnboardingMessages.nicknameTitle}
      />
      <View style={styles.card}>
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
          placeholder={AuthOnboardingMessages.nicknamePlaceholder}
          style={styles.input}
          textContentType="none"
          value={displayName}
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <ActionButton
          label={AuthOnboardingMessages.nicknamePrimaryAction}
          onPress={handleSubmit}
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
    gap: 12,
  },
  card: {
    ...SurfaceCardStyle,
    gap: 10,
  },
  label: FormLabelTextStyle,
  input: FormInputTextStyle,
  errorText: {
    color: AppColors.expense,
    ...StatusMessageTextStyle,
  },
});
