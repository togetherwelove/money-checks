import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { CommonActionCopy } from "../../constants/commonActions";
import { LedgerBookManagementCopy } from "../../constants/ledgerBookManagement";
import { LedgerEditabilityCopy } from "../../constants/ledgerEditability";
import { AppMessages } from "../../constants/messages";
import {
  SubscriptionConfig,
  type SubscriptionTier,
  SubscriptionTiers,
} from "../../constants/subscription";
import { appPlatform } from "../../lib/appPlatform";
import { isLedgerBookEditableWithinPlanLimit } from "../../lib/ledgerEditability";
import { showNativeToast } from "../../lib/nativeToast";
import type { AccessibleLedgerBook, LedgerBook } from "../../types/ledgerBook";
import type { LedgerBookJoinRequestCountByBookId } from "../../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../../types/ledgerBookMember";
import { IconActionButton } from "../IconActionButton";
import { LedgerBookMembers } from "../LedgerBookMembers";
import { TextLinkButton } from "../TextLinkButton";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanelStyles";

type LedgerBookManagementCardProps = {
  accessibleBooks: AccessibleLedgerBook[];
  activeBook: LedgerBook | null;
  canLeaveSharedBook: boolean;
  currentUserId: string;
  isReadOnlyDueToPlanLimit: boolean;
  members: LedgerBookMember[];
  onCreateLedgerBook: (nextName: string) => Promise<boolean>;
  onDeleteActiveLedgerBook: () => Promise<boolean>;
  onKickMember: (targetUserId: string) => Promise<boolean>;
  onLeave: () => unknown;
  onOpenSubscription: () => void;
  onSwitchLedgerBook: (bookId: string) => Promise<boolean>;
  pendingJoinRequestCountsByBookId: LedgerBookJoinRequestCountByBookId;
  shouldShowSharedMemberLimitNotice: boolean;
  subscriptionTier: SubscriptionTier;
};

export function LedgerBookManagementCard({
  accessibleBooks,
  activeBook,
  canLeaveSharedBook,
  currentUserId,
  isReadOnlyDueToPlanLimit,
  members,
  onCreateLedgerBook,
  onDeleteActiveLedgerBook,
  onKickMember,
  onLeave,
  onOpenSubscription,
  onSwitchLedgerBook,
  pendingJoinRequestCountsByBookId,
  shouldShowSharedMemberLimitNotice,
  subscriptionTier,
}: LedgerBookManagementCardProps) {
  const [newBookName, setNewBookName] = useState("");
  const ownedBookCount = accessibleBooks.filter((book) => book.ownerId === currentUserId).length;
  const accessibleBookCount = accessibleBooks.length;
  const ownedBookLimit =
    subscriptionTier === SubscriptionTiers.plus
      ? SubscriptionConfig.plusOwnedLedgerBookLimit
      : SubscriptionConfig.freeOwnedLedgerBookLimit;
  const accessibleBookLimit =
    subscriptionTier === SubscriptionTiers.plus
      ? SubscriptionConfig.plusAccessibleLedgerBookLimit
      : SubscriptionConfig.freeAccessibleLedgerBookLimit;
  const canCreateOwnedBook =
    ownedBookCount < ownedBookLimit && accessibleBookCount < accessibleBookLimit;
  const shouldUseNativeNamePrompt = appPlatform.isIOS;
  const shouldInsetLedgerBookList = shouldUseNativeNamePrompt && !activeBook;
  const isFreePlan = subscriptionTier === SubscriptionTiers.free;
  const createLimitReachedMessage = isFreePlan
    ? LedgerBookManagementCopy.createFreePlanLimitReached
    : LedgerBookManagementCopy.createLimitReached;
  const canDeleteActiveBook = Boolean(
    activeBook?.ownerId === currentUserId && members.length === 1,
  );

  const createLedgerBook = async (normalizedName: string) => {
    const didCreate = await onCreateLedgerBook(normalizedName);
    showNativeToast(
      didCreate ? LedgerBookManagementCopy.createSuccess : LedgerBookManagementCopy.createError,
    );

    if (didCreate) {
      setNewBookName("");
    }
  };

  const resolveCreatableLedgerBookName = (nextName: string) => {
    const normalizedName = nextName.trim();
    if (!normalizedName) {
      showNativeToast(LedgerBookManagementCopy.createNameRequired);
      return null;
    }

    if (!canCreateOwnedBook) {
      showNativeToast(createLimitReachedMessage);
      return null;
    }

    return normalizedName;
  };

  const confirmCreateLedgerBook = (nextName: string) => {
    const normalizedName = resolveCreatableLedgerBookName(nextName);
    if (!normalizedName) {
      return;
    }

    Alert.alert(
      LedgerBookManagementCopy.createConfirmTitle,
      `${normalizedName} ${LedgerBookManagementCopy.createConfirmMessageSuffix}`,
      [
        {
          style: "cancel",
          text: CommonActionCopy.cancel,
        },
        {
          onPress: () => {
            void createLedgerBook(normalizedName);
          },
          text: LedgerBookManagementCopy.createAction,
        },
      ],
    );
  };

  const createLedgerBookFromPrompt = (nextName: string) => {
    const normalizedName = resolveCreatableLedgerBookName(nextName);
    if (!normalizedName) {
      return;
    }

    void createLedgerBook(normalizedName);
  };

  const handlePressCreateLedgerBook = () => {
    if (!canCreateOwnedBook) {
      showNativeToast(createLimitReachedMessage);
      return;
    }

    if (!shouldUseNativeNamePrompt) {
      confirmCreateLedgerBook(newBookName);
      return;
    }

    Alert.prompt(
      LedgerBookManagementCopy.createNamePromptTitle,
      LedgerBookManagementCopy.createNamePromptMessage,
      [
        {
          style: "cancel",
          text: CommonActionCopy.cancel,
        },
        {
          onPress: (nextName?: string) => {
            createLedgerBookFromPrompt(nextName ?? "");
          },
          text: LedgerBookManagementCopy.createAction,
        },
      ],
      "plain-text",
      "",
      "default",
    );
  };

  const handleSwitchLedgerBook = async (bookId: string) => {
    const didSwitch = await onSwitchLedgerBook(bookId);
    showNativeToast(
      didSwitch ? LedgerBookManagementCopy.switchSuccess : LedgerBookManagementCopy.switchError,
    );
  };

  const handleDeleteActiveLedgerBook = () => {
    if (!canDeleteActiveBook) {
      return;
    }

    Alert.alert(
      LedgerBookManagementCopy.deleteConfirmTitle,
      LedgerBookManagementCopy.deleteConfirmMessage,
      [
        {
          style: "cancel",
          text: CommonActionCopy.cancel,
        },
        {
          onPress: async () => {
            const didDelete = await onDeleteActiveLedgerBook();
            showNativeToast(
              didDelete
                ? LedgerBookManagementCopy.deleteSuccess
                : LedgerBookManagementCopy.deleteError,
            );
          },
          style: "destructive",
          text: LedgerBookManagementCopy.deleteAction,
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{LedgerBookManagementCopy.listTitle}</Text>
          <Text style={styles.hintText}>
            {accessibleBookCount}/{accessibleBookLimit}
          </Text>
        </View>
        <IconActionButton
          accessibilityLabel={LedgerBookManagementCopy.createAction}
          disabled={canCreateOwnedBook && !shouldUseNativeNamePrompt && !newBookName.trim()}
          icon="plus"
          onPress={handlePressCreateLedgerBook}
        />
      </View>
      <View
        style={[
          styles.ledgerBookList,
          shouldInsetLedgerBookList ? styles.sectionBottomInset : null,
        ]}
      >
        {accessibleBooks.length > 0 ? (
          accessibleBooks.map((book) => {
            const isActiveBook = book.id === activeBook?.id;
            const isOwner = book.ownerId === currentUserId;
            const isReadOnlyBook = !isLedgerBookEditableWithinPlanLimit(
              subscriptionTier,
              accessibleBooks,
              book.id,
            );
            const ownershipLabel = isOwner
              ? LedgerBookManagementCopy.ownerBadge
              : LedgerBookManagementCopy.sharedBadge;
            const shouldShowPendingRequestBadge =
              isOwner && (pendingJoinRequestCountsByBookId[book.id] ?? 0) > 0;
            const switchIcon = isActiveBook ? "check" : "chevrons-right";
            return (
              <Pressable
                accessibilityLabel={LedgerBookManagementCopy.switchActionAccessibilityLabel}
                accessibilityRole="button"
                key={book.id}
                onPress={() => {
                  if (!isActiveBook) {
                    void handleSwitchLedgerBook(book.id);
                  }
                }}
                style={[
                  styles.ledgerBookItem,
                  isReadOnlyBook ? styles.readOnlyLedgerBookItem : null,
                  isActiveBook ? styles.activeLedgerBookItem : null,
                ]}
              >
                <View style={styles.ledgerBookItemContent}>
                  <View style={styles.ledgerBookItemNameRow}>
                    {shouldShowPendingRequestBadge ? (
                      <View style={styles.pendingRequestBadge} />
                    ) : null}
                    <Text numberOfLines={1} style={styles.ledgerBookItemName}>
                      {book.name}
                    </Text>
                    {isReadOnlyBook ? (
                      <View style={styles.readOnlyLedgerBookChip}>
                        <Text style={styles.readOnlyLedgerBookChipText}>
                          {LedgerEditabilityCopy.readOnlyBadge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.ledgerBookItemMetaRow}>
                    <Text style={styles.ledgerBookItemMeta}>{ownershipLabel}</Text>
                  </View>
                </View>
                <IconActionButton
                  accessibilityLabel={LedgerBookManagementCopy.switchActionAccessibilityLabel}
                  icon={switchIcon}
                  isActive={isActiveBook}
                  onPress={() => {
                    if (!isActiveBook) {
                      void handleSwitchLedgerBook(book.id);
                    }
                  }}
                />
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.helpText}>{LedgerBookManagementCopy.emptyList}</Text>
        )}
      </View>
      {activeBook ? (
        <View
          style={[
            styles.ledgerBookList,
            styles.ledgerBookMembersBlock,
            shouldUseNativeNamePrompt && !canLeaveSharedBook ? styles.sectionBottomInset : null,
          ]}
        >
          <LedgerBookMembers
            currentUserId={currentUserId}
            isManagementDisabled={isReadOnlyDueToPlanLimit}
            members={members}
            onKickMember={onKickMember}
            onOpenSubscription={onOpenSubscription}
            shouldShowSharedMemberLimitNotice={shouldShowSharedMemberLimitNotice}
          />
        </View>
      ) : null}
      {!shouldUseNativeNamePrompt ? (
        <View style={[styles.createBookRow, canLeaveSharedBook ? null : styles.sectionBottomInset]}>
          <TextInput
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect={false}
            editable={canCreateOwnedBook}
            importantForAutofill="no"
            onChangeText={setNewBookName}
            onSubmitEditing={() => {
              handlePressCreateLedgerBook();
            }}
            placeholder={LedgerBookManagementCopy.createNamePlaceholder}
            returnKeyType="done"
            spellCheck={false}
            style={styles.createBookInput}
            submitBehavior="blurAndSubmit"
            textContentType="none"
            value={newBookName}
          />
        </View>
      ) : null}
      {canLeaveSharedBook ? (
        <View style={[styles.disconnectActionRow, styles.sectionBottomInset]}>
          <TextLinkButton
            label={AppMessages.accountDisconnectAction}
            onPress={onLeave}
            tone="destructive"
          />
        </View>
      ) : null}
      {canDeleteActiveBook ? (
        <View style={[styles.disconnectActionRow, styles.sectionBottomInset]}>
          <TextLinkButton
            label={LedgerBookManagementCopy.deleteAction}
            onPress={handleDeleteActiveLedgerBook}
            tone="destructive"
          />
        </View>
      ) : null}
    </View>
  );
}
