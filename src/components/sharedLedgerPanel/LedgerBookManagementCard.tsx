import { TextLinkButton } from "../TextLinkButton";
import { LedgerBookChoice } from "./LedgerBookChoice";
import { getSettingsGroupStyles } from "../../constants/settingsGroupStyles";
import { useRegisterLedgerBookCreateAction } from "./ledgerBookManagementHeader";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useState, type ReactNode } from "react";
import { Alert, Text, TextInput, View } from "react-native";

import { LedgerBookManagementCopy } from "../../constants/ledgerBookManagement";
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
import { SettingsRow } from "../appSettings/SettingsRow";
import { getSharedLedgerPanelStyles } from "./sharedLedgerPanelStyles";

type LedgerBookManagementCardProps = {
  badgedBookIds?: readonly string[];
  accessibleBooks: AccessibleLedgerBook[];
  activeBook: LedgerBook | null;
  activeBookNameControl?: ReactNode;
  canLeaveSharedBook: boolean;
  currentUserId: string;
  isReadOnlyDueToPlanLimit: boolean;
  members: LedgerBookMember[];
  memberLimit: number | null;
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
  activeBookNameControl,
  canLeaveSharedBook,
  currentUserId,
  isReadOnlyDueToPlanLimit,
  members,
  memberLimit,
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

  const hasHeaderCreateAction = useRegisterLedgerBookCreateAction(
    handlePressCreateLedgerBook,
    isCreateActionDisabled,
  );

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

  const currentBook = accessibleBooks.find((book) => book.id === activeBook?.id);
  const otherBooks = accessibleBooks.filter((book) => book.id !== activeBook?.id);
  const renderBook = (book: AccessibleLedgerBook, current = false) => (
    <LedgerBookChoice
      key={book.id}
      book={book}
      current={current}
      currentUserId={currentUserId}
      nameControl={current ? activeBookNameControl : undefined}
      readOnly={!isLedgerBookEditableWithinPlanLimit(subscriptionTier, accessibleBooks, book.id)}
      unread={Boolean(
        badgedBookIds?.includes(book.id) ||
          (book.ownerId === currentUserId && (pendingJoinRequestCountsByBookId[book.id] ?? 0) > 0),
      )}
      onSelect={handleSwitchLedgerBook}
    />
  );

  return (
    <View style={getSharedLedgerPanelStyles().panel}>
      {!hasHeaderCreateAction ? (
        <IconActionButton
          accessibilityLabel={LedgerBookManagementCopy.createAction}
          disabled={isCreateActionDisabled}
          icon="plus"
          onPress={handlePressCreateLedgerBook}
        />
      ) : null}
      {currentBook ? (
        <View style={getSettingsGroupStyles().section}>
          <View style={getSharedLedgerPanelStyles().bookListHeading}>
            <Text style={getSettingsGroupStyles().heading}>
              {LedgerBookManagementCopy.currentBookTitle}
            </Text>
            <Text style={getSharedLedgerPanelStyles().hintText}>
              {accessibleBookCount}/{accessibleBookLimit}
            </Text>
          </View>
          {renderBook(currentBook, true)}
          {canLeaveSharedBook ? (
            <View style={getSharedLedgerPanelStyles().disconnectActionRow}>
              <TextLinkButton
                label={AppMessages.accountDisconnectAction}
                onPress={() => confirmLeaveSharedLedgerBook(onLeave)}
                tone="destructive"
              />
            </View>
          ) : null}
        </View>
      ) : null}
      {activeBook ? (
        <View style={getSharedLedgerPanelStyles().membersDirectory}>
          <LedgerBookMembers
            currentUserId={currentUserId}
            isManagementDisabled={isReadOnlyDueToPlanLimit}
            members={members}
            memberLimit={memberLimit}
            onKickMember={onKickMember}
            onOpenSubscription={onOpenSubscription}
            onTransferOwnership={onTransferOwnership}
            shouldShowSharedMemberLimitNotice={shouldShowSharedMemberLimitNotice}
          />
        </View>
      ) : null}
      {otherBooks.length > 0 ? (
        <View style={getSettingsGroupStyles().section}>
          <View style={getSharedLedgerPanelStyles().bookListHeading}>
            <Text style={getSettingsGroupStyles().heading}>
              {LedgerBookManagementCopy.otherBooksTitle}
            </Text>
            <Text style={getSharedLedgerPanelStyles().hintText}>{otherBooks.length}</Text>
          </View>
          <View style={getSharedLedgerPanelStyles().otherBookList}>
            {otherBooks.map((book) => renderBook(book))}
          </View>
        </View>
      ) : null}
      {accessibleBooks.length === 0 ? (
        <Text style={getSettingsGroupStyles().caption}>{LedgerBookManagementCopy.emptyList}</Text>
      ) : null}
      {!shouldUseNativeNamePrompt ? (
        <View style={getSharedLedgerPanelStyles().createBookRow}>
          <TextInput
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect={false}
            editable={canCreateOwnedBook}
            importantForAutofill="no"
            onChangeText={setNewBookName}
            onSubmitEditing={handlePressCreateLedgerBook}
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
      {canDeleteActiveBook ? (
        <View style={getSharedLedgerPanelStyles().section}>
          <SettingsRow
            label={LedgerBookManagementCopy.deleteAction}
            onPress={handleDeleteActiveLedgerBook}
            destructive
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
