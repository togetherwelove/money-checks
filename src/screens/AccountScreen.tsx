import { type ReactNode,useEffect,useState } from "react";
import {
Alert,
Keyboard,
ScrollView,
StyleSheet,
Text,
TextInput,
View,
} from "react-native";
import { MenuStyles } from "../constants/menuStyles";
import { AppScrollBehavior } from "../constants/scroll";

import { ActionButton } from "../components/ActionButton";
import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { TextLinkButton } from "../components/TextLinkButton";
import { AccountVersionFooter } from "../components/accountScreen/AccountVersionFooter";
import { AdTrackingPermissionCard } from "../components/accountScreen/AdTrackingPermissionCard";
import { DeleteAccountModal } from "../components/accountScreen/DeleteAccountModal";
import { showDeleteSubscriptionWarning } from "../components/accountScreen/showDeleteSubscriptionWarning";
import { AppColors } from "../constants/colors";
import { KeyboardLayout } from "../constants/keyboard";
import { AppMessages } from "../constants/messages";
import {
SubscriptionMessages,
type SubscriptionTier,
SubscriptionTiers,
} from "../constants/subscription";
import {
BrandPlusTextStyle,
UnderlineFormInputTextStyle
} from "../constants/uiStyles";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import type { AdTrackingPermissionState } from "../lib/ads/trackingTransparency";
import { isApplePrivateRelayEmail } from "../lib/auth/applePrivateRelayEmail";
import { signOutFromApp } from "../lib/auth/signOut";
import { showNativeToast } from "../lib/nativeToast";
import { fetchOwnProfileDisplayName,updateOwnProfileDisplayName } from "../lib/profiles";
import { isValidDisplayName,normalizeDisplayNameCandidate } from "../utils/displayName";

type AccountScreenProps = {
  accountProviderLabel: string;
  adTrackingPermissionState: AdTrackingPermissionState;
  email: string;
  fallbackDisplayName: string;
  onOpenAdTrackingSettings: () => void;
  onOpenSubscriptionManagement: () => Promise<void>;
  onRequestAdTrackingPermission: () => void;
  onRestorePurchases: () => Promise<void>;
  screenTitle: ReactNode;
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
  screenTitle,
  showAdTrackingPermissionCard,
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
        text: "취소",
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
      showDeleteSubscriptionWarning(handleOpenSubscriptionManagement, () => setIsDeleteModalOpen(true));
      return;
    }

    setIsDeleteModalOpen(true);
  };


  return (
    <>
      <ScrollView {...AppScrollBehavior}
        contentContainerStyle={styles.content}
        keyboardDismissMode={KeyboardLayout.dismissMode}
        keyboardShouldPersistTaps={KeyboardLayout.persistTaps}
        style={styles.screen}
      >
        {screenTitle}
        <View style={styles.sections}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{AppMessages.accountSessionTitle}</Text>
            <InfoRow label={AppMessages.accountEmail} value={<AccountEmailValue email={email} />} />
            <InfoRow label={AppMessages.accountProvider} value={accountProviderLabel} />
            <InfoRow
              action={
                <>
                  {subscriptionTier === SubscriptionTiers.plus ? (
                    <TextLinkButton
                      label={SubscriptionMessages.manageAction}
                      onPress={handleOpenSubscriptionManagement}
                    />
                  ) : null}
                  <TextLinkButton
                    label={SubscriptionMessages.restoreAction}
                    onPress={handleRestorePurchases}
                  />
                </>
              }
              label={SubscriptionMessages.statusLabel}
              value={
                subscriptionTier === SubscriptionTiers.plus ? (
                  <Text style={styles.value}>
                    <Text style={styles.plusLabelText}>plus</Text> 활성화
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
                label="계정 삭제"
                onPress={handleOpenDeleteFlow}
                tone="destructive"
              />
            </View>
          </View>
          <AccountVersionFooter />
          <AppFooterContentInset />
        </View>
      </ScrollView>
      <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
    </>
  );
}

function AccountEmailValue({ email }: { email: string }) {
  const isPrivateRelayEmail = isApplePrivateRelayEmail(email);

  return (
    <>
      <Text style={styles.value}>{email}</Text>
      {isPrivateRelayEmail ? (
        <View style={styles.privateRelayBadge}>
          <Text style={styles.privateRelayBadgeText}>
            {AppMessages.accountEmailApplePrivateRelayLabel}
          </Text>
        </View>
      ) : null}
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
  sections: {
    gap: MenuStyles.sections.gap,
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  content: {
    ...MenuStyles.content,
  },
  card: {
    ...MenuStyles.panel,
  },
  cardTitle: MenuStyles.sectionTitle,
  infoRow: {
    gap: 4,
    paddingVertical: 4,
  },
  label: MenuStyles.description,
  inlineInput: {
    ...UnderlineFormInputTextStyle,
  },
  value: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  plusLabelText: {
    ...BrandPlusTextStyle,
  },
  privateRelayBadge: {
    backgroundColor: AppColors.surfaceStrong,
    borderColor: AppColors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  privateRelayBadgeText: {
    color: AppColors.primary,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
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
