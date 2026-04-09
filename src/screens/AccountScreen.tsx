import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { AccountVersionFooter } from "../components/accountScreen/AccountVersionFooter";
import { DeleteAccountCard } from "../components/accountScreen/DeleteAccountCard";
import { AppColors } from "../constants/colors";
import { EmailAuthCopy } from "../constants/emailAuth";
import { NicknameAutofillProps } from "../constants/inputAutofill";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import {
  CardTitleTextStyle,
  CompactLabelTextStyle,
  FormInputTextStyle,
  StatusMessageTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
import { signOutFromApp } from "../lib/auth/signOut";
import { fetchOwnProfileDisplayName, updateOwnProfileDisplayName } from "../lib/profiles";
import { isValidDisplayName, normalizeDisplayNameCandidate } from "../utils/displayName";

type AccountScreenProps = {
  email: string;
  fallbackDisplayName: string;
  userId: string;
};

export function AccountScreen({ email, fallbackDisplayName, userId }: AccountScreenProps) {
  const [displayName, setDisplayName] = useState(fallbackDisplayName);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const nextDisplayName = await fetchOwnProfileDisplayName(userId);
        const normalizedDisplayName = normalizeDisplayNameCandidate(nextDisplayName);
        if (isMounted && normalizedDisplayName) {
          setDisplayName(normalizedDisplayName);
        }
      } catch {
        if (isMounted) {
          setDisplayName(fallbackDisplayName);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [fallbackDisplayName, userId]);

  const handleSaveDisplayName = async () => {
    if (!isValidDisplayName(displayName)) {
      setHasError(true);
      setStatusMessage(AppMessages.accountNicknameRequiredError);
      return;
    }

    try {
      const savedDisplayName = await updateOwnProfileDisplayName(userId, displayName);
      setDisplayName(savedDisplayName || fallbackDisplayName);
      setHasError(false);
      setStatusMessage(AppMessages.accountNicknameSuccess);
    } catch {
      setHasError(true);
      setStatusMessage(AppMessages.accountNicknameError);
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={[styles.card, styles.primaryCard]}>
        <Text style={styles.cardTitle}>{AppMessages.accountSessionTitle}</Text>
        <InfoRow label={AppMessages.accountEmail} value={email} />
        <InfoRow label={AppMessages.accountProvider} value={EmailAuthCopy.accountProviderValue} />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{AppMessages.accountNicknameTitle}</Text>
        <Text style={styles.label}>{AppMessages.accountNicknameSubtitle}</Text>
        <TextInput
          {...NicknameAutofillProps}
          onChangeText={(value) => {
            setDisplayName(value);
            if (statusMessage) {
              setStatusMessage(null);
            }
          }}
          placeholder={fallbackDisplayName || AppMessages.accountNicknamePlaceholder}
          style={styles.input}
          value={displayName}
        />
        {statusMessage ? (
          <Text style={[styles.statusText, hasError ? styles.errorText : styles.successText]}>
            {statusMessage}
          </Text>
        ) : null}
        <View style={styles.actionRow}>
          <ActionButton
            label={AppMessages.accountNicknameSave}
            onPress={handleSaveDisplayName}
            variant="primary"
          />
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{AppMessages.accountActionTitle}</Text>
        <View style={styles.actionRow}>
          <ActionButton
            label={AppMessages.authSignOut}
            onPress={signOutFromApp}
            variant="destructive"
          />
        </View>
      </View>
      <DeleteAccountCard />
      <AccountVersionFooter />
    </KeyboardAwareScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
    paddingBottom: 24,
  },
  card: {
    ...SurfaceCardStyle,
    gap: 8,
  },
  primaryCard: {
    backgroundColor: AppColors.surfaceMuted,
  },
  cardTitle: CardTitleTextStyle,
  infoRow: {
    gap: 4,
    paddingVertical: 6,
  },
  label: CompactLabelTextStyle,
  input: FormInputTextStyle,
  value: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  statusText: StatusMessageTextStyle,
  successText: {
    color: AppColors.income,
  },
  errorText: {
    color: AppColors.expense,
  },
  actionRow: {
    paddingTop: 2,
  },
});
