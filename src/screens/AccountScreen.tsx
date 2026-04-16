import { useEffect, useState } from "react";
import { Alert, Keyboard, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { TextLinkButton } from "../components/TextLinkButton";
import { AccountVersionFooter } from "../components/accountScreen/AccountVersionFooter";
import { DeleteAccountModal } from "../components/accountScreen/DeleteAccountModal";
import { AccountDeletionMessages } from "../constants/accountDeletionMessages";
import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import {
  SubscriptionMessages,
  type SubscriptionTier,
  SubscriptionTiers,
} from "../constants/subscription";
import {
  CardTitleTextStyle,
  CompactLabelTextStyle,
  FormInputTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import { signOutFromApp } from "../lib/auth/signOut";
import { showNativeToast } from "../lib/nativeToast";
import { fetchOwnProfileDisplayName, updateOwnProfileDisplayName } from "../lib/profiles";
import { isValidDisplayName, normalizeDisplayNameCandidate } from "../utils/displayName";

type AccountScreenProps = {
  accountProviderLabel: string;
  email: string;
  fallbackDisplayName: string;
  subscriptionTier: SubscriptionTier;
  trackBlockingTask: BusyTaskTracker;
  userId: string;
};

export function AccountScreen({
  accountProviderLabel,
  email,
  fallbackDisplayName,
  subscriptionTier,
  trackBlockingTask,
  userId,
}: AccountScreenProps) {
  const [displayName, setDisplayName] = useState(fallbackDisplayName);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);

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
    if (isSavingDisplayName) {
      return;
    }

    if (!isValidDisplayName(displayName)) {
      showNativeToast(AppMessages.accountNicknameRequiredError);
      return;
    }

    setIsSavingDisplayName(true);

    try {
      const savedDisplayName = await trackBlockingTask(() =>
        updateOwnProfileDisplayName(userId, displayName),
      );
      setDisplayName(savedDisplayName || fallbackDisplayName);
      showNativeToast(AppMessages.accountNicknameSuccess);
      Keyboard.dismiss();
    } catch {
      showNativeToast(AppMessages.accountNicknameError);
    } finally {
      setIsSavingDisplayName(false);
    }
  };

  const handlePressSaveDisplayName = () => {
    void handleSaveDisplayName();
  };

  const handleConfirmSignOut = () => {
    Alert.alert(AppMessages.authSignOutConfirmTitle, AppMessages.authSignOutConfirmMessage, [
      {
        style: "cancel",
        text: CommonActionCopy.cancel,
      },
      {
        onPress: () => {
          void signOutFromApp();
        },
        style: "destructive",
        text: AppMessages.authSignOut,
      },
    ]);
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={[styles.card, styles.primaryCard]}>
        <Text style={styles.cardTitle}>{AppMessages.accountSessionTitle}</Text>
        <InfoRow label={AppMessages.accountEmail} value={email} />
        <InfoRow label={AppMessages.accountProvider} value={accountProviderLabel} />
        <InfoRow
          label={SubscriptionMessages.statusLabel}
          value={
            subscriptionTier === SubscriptionTiers.plus
              ? SubscriptionMessages.plusPlanLabel
              : SubscriptionMessages.freePlanLabel
          }
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{AppMessages.accountNicknameTitle}</Text>
        <TextInput
          onChangeText={(value) => {
            setDisplayName(value);
          }}
          placeholder={fallbackDisplayName || AppMessages.accountNicknamePlaceholder}
          autoCapitalize="words"
          autoComplete="nickname"
          autoCorrect={false}
          submitBehavior="blurAndSubmit"
          importantForAutofill="no"
          onSubmitEditing={handlePressSaveDisplayName}
          placeholderTextColor={AppColors.mutedText}
          returnKeyType="done"
          editable={!isSavingDisplayName}
          style={styles.inlineInput}
          textContentType="none"
          value={displayName}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{AppMessages.accountActionTitle}</Text>
        <View style={styles.actionRow}>
          <ActionButton
            label={AppMessages.authSignOut}
            onPress={handleConfirmSignOut}
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
    paddingVertical: 4,
  },
  label: CompactLabelTextStyle,
  inlineInput: {
    ...FormInputTextStyle,
  },
  value: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  actionRow: {
    paddingTop: 2,
  },
  deleteActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
