import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { EMPTY_VALUE_PLACEHOLDER } from "../../constants/ledgerDisplay";
import { LedgerBookNicknameCopy } from "../../constants/ledgerBookNickname";
import { AppMessages } from "../../constants/messages";
import { ShareLedgerMessages } from "../../constants/shareLedgerMessages";
import { showNativeToast } from "../../lib/nativeToast";
import type { LedgerBook } from "../../types/ledgerBook";
import type { LedgerBookJoinRequest } from "../../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../../types/ledgerBookMember";
import { IconActionButton } from "../IconActionButton";
import { LedgerBookJoinRequests } from "../LedgerBookJoinRequests";
import { LedgerBookMembers } from "../LedgerBookMembers";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanelStyles";

type SharedLedgerBookCardProps = {
  activeBook: LedgerBook | null;
  bookName: string | null;
  bookNameInput: string;
  canEditBookName: boolean;
  currentUserId: string;
  isOwner: boolean;
  members: LedgerBookMember[];
  onApproveJoinRequest: (requestId: string) => Promise<boolean>;
  onBeforeCopyShareCode: () => Promise<void>;
  onChangeBookName: (value: string) => void;
  onKickMember: (targetUserId: string) => Promise<boolean>;
  onOpenSubscription: () => void;
  onRejectJoinRequest: (requestId: string) => Promise<boolean>;
  onSaveBookName: () => Promise<boolean>;
  pendingJoinRequests: LedgerBookJoinRequest[];
  shouldShowSharedMemberLimitNotice: boolean;
};

export function SharedLedgerBookCard({
  activeBook,
  bookName,
  bookNameInput,
  canEditBookName,
  currentUserId,
  isOwner,
  members,
  onApproveJoinRequest,
  onBeforeCopyShareCode,
  onChangeBookName,
  onKickMember,
  onOpenSubscription,
  onRejectJoinRequest,
  onSaveBookName,
  pendingJoinRequests,
  shouldShowSharedMemberLimitNotice,
}: SharedLedgerBookCardProps) {
  const [isEditingBookName, setIsEditingBookName] = useState(false);
  const isSharedBook = Boolean(activeBook && activeBook.ownerId !== currentUserId);
  const shareCode = activeBook?.shareCode ?? null;

  const handleCopyShareCode = async () => {
    if (!shareCode) {
      return;
    }

    await onBeforeCopyShareCode();
    await Clipboard.setStringAsync(shareCode);
    showNativeToast(ShareLedgerMessages.copyCodeSuccessToast);
  };

  const handleStartEditingBookName = () => {
    setIsEditingBookName(true);
  };

  const handleCancelEditingBookName = () => {
    onChangeBookName(bookName ?? LedgerBookNicknameCopy.defaultName);
    setIsEditingBookName(false);
  };

  const handleSaveBookNamePress = () => {
    void onSaveBookName().then((didSave) => {
      if (didSave) {
        setIsEditingBookName(false);
      }
    });
  };

  return (
    <View style={[styles.section, styles.primarySection]}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerContent}>
          {canEditBookName ? (
            isEditingBookName ? (
              <View style={styles.bookNameEditRow}>
                <TextInput
                  autoCapitalize="words"
                  autoComplete="off"
                  autoCorrect={false}
                  importantForAutofill="no"
                  onChangeText={onChangeBookName}
                  onSubmitEditing={handleSaveBookNamePress}
                  placeholder={LedgerBookNicknameCopy.inputPlaceholder}
                  returnKeyType="done"
                  spellCheck={false}
                  style={styles.bookNameHeaderInput}
                  submitBehavior="blurAndSubmit"
                  textContentType="none"
                  value={bookNameInput}
                />
                <View style={styles.bookNameActionSlot}>
                  <Text onPress={handleCancelEditingBookName} style={styles.bookNameCancelAction}>
                    {LedgerBookNicknameCopy.cancelAction}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.bookNameRow}>
                <Text numberOfLines={1} style={styles.bookName}>
                  {bookName ?? LedgerBookNicknameCopy.defaultName}
                </Text>
                <IconActionButton
                  accessibilityLabel={LedgerBookNicknameCopy.editActionAccessibilityLabel}
                  icon="edit-3"
                  onPress={handleStartEditingBookName}
                  size="compact"
                />
              </View>
            )
          ) : (
            <Text numberOfLines={1} style={styles.bookName}>
              {bookName ?? AppMessages.accountBookFallback}
            </Text>
          )}
        </View>
        {isSharedBook ? (
          <View style={[styles.stateBadge, styles.sharedBadge]}>
            <Text style={[styles.stateBadgeText, styles.sharedBadgeText]}>
              {AppMessages.accountBookSharedState}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.codeBlock}>
        <Text style={styles.sectionLabel}>{AppMessages.accountShareCode}</Text>
        <View style={styles.shareCodeRow}>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            numberOfLines={1}
            style={styles.shareCode}
          >
            {shareCode ?? EMPTY_VALUE_PLACEHOLDER}
          </Text>
          {shareCode ? (
            <IconActionButton
              accessibilityLabel={ShareLedgerMessages.copyCodeAccessibilityLabel}
              icon="copy"
              onPress={() => {
                void handleCopyShareCode();
              }}
            />
          ) : null}
        </View>
        <Text style={styles.helpText}>{AppMessages.accountShareCodeHint}</Text>
      </View>
      {activeBook ? (
        <LedgerBookMembers
          currentUserId={currentUserId}
          members={members}
          onKickMember={onKickMember}
          onOpenSubscription={onOpenSubscription}
          shouldShowSharedMemberLimitNotice={shouldShowSharedMemberLimitNotice}
        />
      ) : null}
      {isOwner ? (
        <LedgerBookJoinRequests
          onApproveRequest={onApproveJoinRequest}
          onRejectRequest={onRejectJoinRequest}
          requests={pendingJoinRequests}
        />
      ) : null}
    </View>
  );
}
