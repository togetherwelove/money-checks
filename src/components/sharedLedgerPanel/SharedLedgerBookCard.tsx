import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { LedgerBookNicknameCopy } from "../../constants/ledgerBookNickname";
import { EMPTY_VALUE_PLACEHOLDER } from "../../constants/ledgerDisplay";
import { AppMessages } from "../../constants/messages";
import { ShareLedgerCopy } from "../../constants/shareLedgerCopy";
import { showNativeToast } from "../../lib/nativeToast";
import type { LedgerBook } from "../../types/ledgerBook";
import type { LedgerBookJoinRequest } from "../../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../../types/ledgerBookMember";
import { ActionButton } from "../ActionButton";
import { IconActionButton } from "../IconActionButton";
import { LedgerBookJoinRequests } from "../LedgerBookJoinRequests";
import { LedgerBookMembers } from "../LedgerBookMembers";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanelStyles";

type SharedLedgerBookCardProps = {
  activeBook: LedgerBook | null;
  bookName: string | null;
  bookNameInput: string;
  bookNameStatusMessage: string | null;
  currentUserId: string;
  isOwner: boolean;
  members: LedgerBookMember[];
  onApproveJoinRequest: (requestId: string) => Promise<boolean>;
  onChangeBookName: (value: string) => void;
  onKickMember: (targetUserId: string) => Promise<boolean>;
  onRejectJoinRequest: (requestId: string) => Promise<boolean>;
  onSaveBookName: () => void;
  pendingJoinRequests: LedgerBookJoinRequest[];
};

export function SharedLedgerBookCard({
  activeBook,
  bookName,
  bookNameInput,
  bookNameStatusMessage,
  currentUserId,
  isOwner,
  members,
  onApproveJoinRequest,
  onChangeBookName,
  onKickMember,
  onRejectJoinRequest,
  onSaveBookName,
  pendingJoinRequests,
}: SharedLedgerBookCardProps) {
  const [isEditingBookName, setIsEditingBookName] = useState(false);
  const isSharedBook = Boolean(activeBook && activeBook.ownerId !== currentUserId);
  const shareCode = activeBook?.shareCode ?? null;

  const handleCopyShareCode = () => {
    if (!shareCode) {
      return;
    }

    void Clipboard.setStringAsync(shareCode).then(() => {
      showNativeToast(ShareLedgerCopy.copySuccessToast);
    });
  };

  const handleStartEditingBookName = () => {
    setIsEditingBookName(true);
  };

  const handleCancelEditingBookName = () => {
    onChangeBookName(bookName ?? LedgerBookNicknameCopy.defaultName);
    setIsEditingBookName(false);
  };

  const handleSaveBookNamePress = () => {
    onSaveBookName();
    setIsEditingBookName(false);
  };

  return (
    <View style={[styles.section, styles.primarySection]}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerContent}>
          {isOwner ? (
            isEditingBookName ? (
              <View style={styles.bookNameEditRow}>
                <TextInput
                  autoCapitalize="words"
                  autoComplete="off"
                  autoCorrect={false}
                  importantForAutofill="no"
                  onChangeText={onChangeBookName}
                  placeholder={LedgerBookNicknameCopy.inputPlaceholder}
                  spellCheck={false}
                  style={styles.bookNameHeaderInput}
                  textContentType="none"
                  value={bookNameInput}
                />
                <View style={styles.bookNameActionSlot}>
                  <ActionButton
                    label={LedgerBookNicknameCopy.saveAction}
                    onPress={handleSaveBookNamePress}
                  />
                </View>
                <View style={styles.bookNameActionSlot}>
                  <ActionButton
                    label={LedgerBookNicknameCopy.cancelAction}
                    onPress={handleCancelEditingBookName}
                    variant="secondary"
                  />
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
          {bookNameStatusMessage ? (
            <Text style={styles.successText}>{bookNameStatusMessage}</Text>
          ) : null}
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
              accessibilityLabel={ShareLedgerCopy.copyActionAccessibilityLabel}
              icon="copy"
              onPress={handleCopyShareCode}
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
