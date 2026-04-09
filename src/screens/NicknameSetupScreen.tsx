import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { ScreenHeaderBlock } from "../components/ScreenHeaderBlock";
import { AuthOnboardingMessages } from "../constants/authOnboarding";
import { AppColors } from "../constants/colors";
import { DisabledAutofillProps } from "../constants/inputAutofill";
import { AppLayout } from "../constants/layout";
import { isValidDisplayName } from "../utils/displayName";

type NicknameSetupScreenProps = {
  initialDisplayName: string;
  onSubmit: (displayName: string) => Promise<boolean>;
};

export function NicknameSetupScreen({ initialDisplayName, onSubmit }: NicknameSetupScreenProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        subtitle={AuthOnboardingMessages.nicknameSubtitle}
        title={AuthOnboardingMessages.nicknameTitle}
      />
      <View style={styles.card}>
        <Text style={styles.label}>{AuthOnboardingMessages.nicknameLabel}</Text>
        <TextInput
          {...DisabledAutofillProps}
          onChangeText={(value) => {
            setDisplayName(value);
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
          placeholder={AuthOnboardingMessages.nicknamePlaceholder}
          style={styles.input}
          value={displayName}
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <ActionButton
          label={AuthOnboardingMessages.nicknamePrimaryAction}
          onPress={() => {
            void handleSubmit();
          }}
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
    gap: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 24,
    backgroundColor: AppColors.surface,
    padding: 16,
  },
  label: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    color: AppColors.text,
    fontSize: 16,
  },
  errorText: {
    color: AppColors.expense,
    fontSize: 12,
    lineHeight: 18,
  },
});
