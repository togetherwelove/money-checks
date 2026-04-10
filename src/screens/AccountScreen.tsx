import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { TextLinkButton } from "../components/TextLinkButton";
import { AccountVersionFooter } from "../components/accountScreen/AccountVersionFooter";
import { DeleteAccountModal } from "../components/accountScreen/DeleteAccountModal";
import { AccountDeletionMessages } from "../constants/accountDeletionMessages";
import { AppColors } from "../constants/colors";
import { EmailAuthCopy } from "../constants/emailAuth";
import { AppLayout } from "../constants/layout";
import { LedgerBookNicknameCopy } from "../constants/ledgerBookNickname";
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
        <View style={styles.inlineEditRow}>
          <TextInput
            onChangeText={(value) => {
              setDisplayName(value);
              if (statusMessage) {
                setStatusMessage(null);
              }
            }}
            placeholder={fallbackDisplayName || AppMessages.accountNicknamePlaceholder}
            style={styles.inlineInput}
            value={displayName}
          />
          <View style={styles.nicknameActionSlot}>
            <ActionButton
              label={AppMessages.accountNicknameSave}
              onPress={handleSaveDisplayName}
              variant="primary"
            />
          </View>
        </View>
        {statusMessage ? (
          <Text style={[styles.statusText, hasError ? styles.errorText : styles.successText]}>
            {statusMessage}
          </Text>
        ) : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{AppMessages.accountActionTitle}</Text>
        <View style={styles.actionRow}>
          <ActionButton
            label={AppMessages.authSignOut}
            onPress={signOutFromApp}
            size="inline"
            variant="secondary"
          />
        </View>
        <View style={styles.deleteActionRow}>
          <TextLinkButton
            label={AccountDeletionMessages.openAction}
            onPress={() => setIsDeleteModalOpen(true)}
            tone="destructive"
          />
        </View>
      </View>
      <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
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
  inlineEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineInput: {
    ...FormInputTextStyle,
    flex: 1,
  },
  nicknameActionSlot: {
    minWidth: LedgerBookNicknameCopy.actionMinWidth,
  },
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
  deleteActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
