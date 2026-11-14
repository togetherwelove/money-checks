import { useAppTheme } from "../../hooks/useAppTheme";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { LedgerBookManagementCopy } from "../../constants/ledgerBookManagement";
import { AppMessages } from "../../constants/messages";
import { NotificationBadgeCopy } from "../../constants/notificationBadges";
import { SharedLedgerPanelUi } from "../../constants/sharedLedgerPanel";
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
import { getSharedLedgerPanelStyles } from "./sharedLedgerPanelStyles";

type LedgerBookManagementCardProps = {
  badgedBookIds?: readonly string[];
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
  onTransferOwnership: (targetUserId: string) => Promise<boolean>;
  pendingJoinRequestCountsByBookId: LedgerBookJoinRequestCountByBookId;
  shouldShowSharedMemberLimitNotice: boolean;
  subscriptionTier: SubscriptionTier;
};

export function LedgerBookManagementCard({
  badgedBookIds,
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
  onTransferOwnership,
  pendingJoinRequestCountsByBookId,
  shouldShowSharedMemberLimitNotice,
  subscriptionTier,
}: LedgerBookManagementCardProps) {
  useAppTheme();
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
  const isCreateActionDisabled =
    canCreateOwnedBook && !shouldUseNativeNamePrompt && !newBookName.trim();

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
          text: "취소",
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
          text: "취소",
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
          text: "취소",
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
    <View style={getSharedLedgerPanelStyles().section}>
      <View style={getSharedLedgerPanelStyles().sectionHeader}>
        <View style={getSharedLedgerPanelStyles().sectionTitleRow}>
          <Text style={getSharedLedgerPanelStyles().sectionTitle}>
            {LedgerBookManagementCopy.listTitle}
          </Text>
          <Text style={getSharedLedgerPanelStyles().hintText}>
            {accessibleBookCount}/{accessibleBookLimit}
          </Text>
        </View>
        <IconActionButton
          accessibilityLabel={LedgerBookManagementCopy.createAction}
          disabled={isCreateActionDisabled}
          icon="plus"
          onPress={handlePressCreateLedgerBook}
        />
      </View>
      <View
        style={[
          getSharedLedgerPanelStyles().ledgerBookList,
          shouldInsetLedgerBookList ? getSharedLedgerPanelStyles().sectionBottomInset : null,
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
            const visibleShareCode =
              isActiveBook && book.shareCode ? formatVisibleShareCode(book.shareCode) : null;
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
                  getSharedLedgerPanelStyles().ledgerBookItem,
                  isReadOnlyBook ? getSharedLedgerPanelStyles().readOnlyLedgerBookItem : null,
                  isActiveBook ? getSharedLedgerPanelStyles().activeLedgerBookItem : null,
                ]}
              >
                <View style={getSharedLedgerPanelStyles().ledgerBookItemContent}>
                  <View style={getSharedLedgerPanelStyles().ledgerBookItemNameRow}>
                    {shouldShowPendingRequestBadge || badgedBookIds?.includes(book.id) ? (
                      <View
                        accessible
                        accessibilityLabel={NotificationBadgeCopy.unreadBookAccessibilityLabel}
                        style={getSharedLedgerPanelStyles().pendingRequestBadge}
                      />
                    ) : null}
                    <Text
                      numberOfLines={1}
                      style={[
                        getSharedLedgerPanelStyles().ledgerBookItemName,
                        isActiveBook ? getSharedLedgerPanelStyles().activeLedgerBookItemName : null,
                      ]}
                    >
                      {book.name}
                    </Text>
                    {isReadOnlyBook ? (
                      <View style={getSharedLedgerPanelStyles().readOnlyLedgerBookChip}>
                        <Text style={getSharedLedgerPanelStyles().readOnlyLedgerBookChipText}>
                          조회 전용
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={getSharedLedgerPanelStyles().ledgerBookItemMetaRow}>
                    <Text style={getSharedLedgerPanelStyles().ledgerBookItemMeta}>
                      {ownershipLabel}
                    </Text>
                    {visibleShareCode ? (
                      <View style={getSharedLedgerPanelStyles().shareCodePreviewRow}>
                        <Text selectable style={getSharedLedgerPanelStyles().shareCodePreviewValue}>
                          {visibleShareCode}
                        </Text>
                      </View>
                    ) : null}
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
          <Text style={getSharedLedgerPanelStyles().helpText}>
            {LedgerBookManagementCopy.emptyList}
          </Text>
        )}
      </View>
      {activeBook ? (
        <View
          style={[
            getSharedLedgerPanelStyles().ledgerBookList,
            getSharedLedgerPanelStyles().ledgerBookMembersBlock,
            shouldUseNativeNamePrompt && !canLeaveSharedBook
              ? getSharedLedgerPanelStyles().sectionBottomInset
              : null,
          ]}
        >
          <LedgerBookMembers
            currentUserId={currentUserId}
            isManagementDisabled={isReadOnlyDueToPlanLimit}
            members={members}
            onKickMember={onKickMember}
            onOpenSubscription={onOpenSubscription}
            onTransferOwnership={onTransferOwnership}
            shouldShowSharedMemberLimitNotice={shouldShowSharedMemberLimitNotice}
          />
        </View>
      ) : null}
      {!shouldUseNativeNamePrompt ? (
        <View
          style={[
            getSharedLedgerPanelStyles().createBookRow,
            canLeaveSharedBook ? null : getSharedLedgerPanelStyles().sectionBottomInset,
          ]}
        >
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
            style={getSharedLedgerPanelStyles().createBookInput}
            submitBehavior="blurAndSubmit"
            textContentType="none"
            value={newBookName}
          />
        </View>
      ) : null}
      {canLeaveSharedBook ? (
        <View
          style={[
            getSharedLedgerPanelStyles().disconnectActionRow,
            getSharedLedgerPanelStyles().sectionBottomInset,
          ]}
        >
          <TextLinkButton
            label={AppMessages.accountDisconnectAction}
            onPress={() => {
              confirmLeaveSharedLedgerBook(onLeave);
            }}
            tone="destructive"
          />
        </View>
      ) : null}
      {canDeleteActiveBook ? (
        <View
          style={[
            getSharedLedgerPanelStyles().disconnectActionRow,
            getSharedLedgerPanelStyles().sectionBottomInset,
          ]}
        >
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

function confirmLeaveSharedLedgerBook(onConfirm: () => unknown) {
  Alert.alert(
    AppMessages.accountDisconnectConfirmTitle,
    AppMessages.accountDisconnectConfirmMessage,
    [
      {
        style: "cancel",
        text: "취소",
      },
      {
        onPress: onConfirm,
        style: "destructive",
        text: AppMessages.accountDisconnectAction,
      },
    ],
  );
}

function formatVisibleShareCode(shareCode: string): string {
  return `${shareCode.slice(0, SharedLedgerPanelUi.shareCodePreviewPrefixLength)}${
    SharedLedgerPanelUi.shareCodePreviewMask
  }`;
}
