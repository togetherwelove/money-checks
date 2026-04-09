import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { ScreenHeaderBlock } from "../components/ScreenHeaderBlock";
import { AuthOnboardingMessages } from "../constants/authOnboarding";
import { AppColors } from "../constants/colors";
import { OnboardingNicknameInputProps } from "../constants/inputAutofill";
import { AppLayout } from "../constants/layout";
import {
  FormInputTextStyle,
  FormLabelTextStyle,
  StatusMessageTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
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
          {...OnboardingNicknameInputProps}
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
