import { type ReactNode, useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ActionButton } from "../components/ActionButton";
import { TextLinkButton } from "../components/TextLinkButton";
import { AccountLanguageCard } from "../components/accountScreen/AccountLanguageCard";
import { AccountVersionFooter } from "../components/accountScreen/AccountVersionFooter";
import { AdTrackingPermissionCard } from "../components/accountScreen/AdTrackingPermissionCard";
import { DeleteAccountModal } from "../components/accountScreen/DeleteAccountModal";
import { DeleteAccountSubscriptionWarningModal } from "../components/accountScreen/DeleteAccountSubscriptionWarningModal";
import { AccountDeletionMessages } from "../constants/accountDeletionMessages";
import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { KeyboardLayout } from "../constants/keyboard";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import {
  SubscriptionMessages,
  type SubscriptionTier,
  SubscriptionTiers,
} from "../constants/subscription";
import { SubscriptionManagementMessages } from "../constants/subscriptionManagement";
import { SubscriptionPlusLabels } from "../constants/subscriptionPlusLabels";
import {
  BrandPlusTextStyle,
  CardTitleTextStyle,
  CompactLabelTextStyle,
  FormInputTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import type { AdTrackingPermissionState } from "../lib/ads/trackingTransparency";
import { signOutFromApp } from "../lib/auth/signOut";
import { showNativeToast } from "../lib/nativeToast";
import { fetchOwnProfileDisplayName, updateOwnProfileDisplayName } from "../lib/profiles";
import { isValidDisplayName, normalizeDisplayNameCandidate } from "../utils/displayName";

type AccountScreenProps = {
  accountProviderLabel: string;
  adTrackingPermissionState: AdTrackingPermissionState;
  email: string;
  fallbackDisplayName: string;
  onOpenAdTrackingSettings: () => void;
  onOpenSubscriptionManagement: () => Promise<void>;
  onRequestAdTrackingPermission: () => void;
  onRestorePurchases: () => Promise<void>;
  showAdTrackingPermissionCard: boolean;
  subscriptionTier: SubscriptionTier;
  trackBlockingTask: BusyTaskTracker;
  userId: string;
};

export function AccountScreen({
  accountProviderLabel,
  adTrackingPermissionState,
  email,
  fallbackDisplayName,
  onOpenAdTrackingSettings,
  onOpenSubscriptionManagement,
  onRequestAdTrackingPermission,
  onRestorePurchases,
  showAdTrackingPermissionCard,
  subscriptionTier,
  trackBlockingTask,
  userId,
}: AccountScreenProps) {
  const [displayName, setDisplayName] = useState(fallbackDisplayName);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSubscriptionWarningOpen, setIsDeleteSubscriptionWarningOpen] = useState(false);
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

  const handleRestorePurchases = () => {
    void onRestorePurchases();
  };

  const handleOpenSubscriptionManagement = () => {
    void onOpenSubscriptionManagement();
  };

  const handleOpenDeleteFlow = () => {
    if (subscriptionTier === SubscriptionTiers.plus) {
      setIsDeleteSubscriptionWarningOpen(true);
      return;
    }

    setIsDeleteModalOpen(true);
  };

  const handleContinueDeleteFromSubscriptionWarning = () => {
    setIsDeleteSubscriptionWarningOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleManageSubscriptionFromDeleteWarning = () => {
    setIsDeleteSubscriptionWarningOpen(false);
    handleOpenSubscriptionManagement();
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode={
          Platform.OS === "ios"
            ? KeyboardLayout.dismissMode.ios
            : KeyboardLayout.dismissMode.android
        }
        keyboardShouldPersistTaps={KeyboardLayout.persistTaps}
        style={styles.screen}
      >
        <View style={[styles.card, styles.primaryCard]}>
          <Text style={styles.cardTitle}>{AppMessages.accountSessionTitle}</Text>
          <InfoRow label={AppMessages.accountEmail} value={email} />
          <InfoRow label={AppMessages.accountProvider} value={accountProviderLabel} />
          <InfoRow
            action={
              subscriptionTier === SubscriptionTiers.free ? (
                <TextLinkButton
                  label={SubscriptionMessages.restoreAction}
                  onPress={handleRestorePurchases}
                />
              ) : subscriptionTier === SubscriptionTiers.plus ? (
                <TextLinkButton
                  label={SubscriptionManagementMessages.actionLabel}
                  onPress={handleOpenSubscriptionManagement}
                />
              ) : null
            }
            label={SubscriptionMessages.statusLabel}
            value={
              subscriptionTier === SubscriptionTiers.plus ? (
                <Text style={styles.value}>
                  <Text style={styles.plusLabelText}>plus</Text>{" "}
                  {SubscriptionPlusLabels.accountActiveSuffix}
                </Text>
              ) : (
                SubscriptionMessages.freePlanLabel
              )
            }
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{AppMessages.accountNicknameTitle}</Text>
          <TextInput
            autoCapitalize="words"
            autoComplete="nickname"
            autoCorrect={false}
            editable={!isSavingDisplayName}
            importantForAutofill="no"
            onChangeText={(value) => {
              setDisplayName(value);
            }}
            onSubmitEditing={handlePressSaveDisplayName}
            placeholder={fallbackDisplayName || AppMessages.accountNicknamePlaceholder}
            placeholderTextColor={AppColors.mutedText}
            returnKeyType="done"
            style={styles.inlineInput}
            submitBehavior="blurAndSubmit"
            textContentType="none"
            value={displayName}
          />
        </View>
        <AccountLanguageCard />
        {showAdTrackingPermissionCard ? (
          <AdTrackingPermissionCard
            onOpenSettings={onOpenAdTrackingSettings}
            onRequestPermission={onRequestAdTrackingPermission}
            permissionState={adTrackingPermissionState}
          />
        ) : null}
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
              onPress={handleOpenDeleteFlow}
              tone="destructive"
            />
          </View>
        </View>
        <AccountVersionFooter />
      </ScrollView>
      <DeleteAccountSubscriptionWarningModal
        isOpen={isDeleteSubscriptionWarningOpen}
        onClose={() => setIsDeleteSubscriptionWarningOpen(false)}
        onContinueDelete={handleContinueDeleteFromSubscriptionWarning}
        onOpenSubscriptionManagement={handleManageSubscriptionFromDeleteWarning}
      />
      <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
    </>
  );
}

function InfoRow({
  action = null,
  label,
  value,
}: {
  action?: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        {typeof value === "string" ? <Text style={styles.value}>{value}</Text> : value}
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenTopPadding,
    gap: AppLayout.cardGap,
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
  plusLabelText: {
    ...BrandPlusTextStyle,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  actionRow: {
    paddingTop: 2,
  },
  deleteActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
