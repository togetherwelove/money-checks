import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { LedgerBookNicknameCopy } from "../../constants/ledgerBookNickname";
import { SHARE_CODE_LENGTH } from "../../constants/ledgerDisplay";
import { AppMessages } from "../../constants/messages";
import { ShareLedgerMessages } from "../../constants/shareLedgerMessages";
import { showNativeToast } from "../../lib/nativeToast";
import type { LedgerBook } from "../../types/ledgerBook";
import type { LedgerBookJoinRequest } from "../../types/ledgerBookJoinRequest";
import { ActionButton } from "../ActionButton";
import { IconActionButton } from "../IconActionButton";
import { LedgerBookJoinRequests } from "../LedgerBookJoinRequests";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanelStyles";

type SharedLedgerBookCardProps = {
  activeBook: LedgerBook | null;
  bookName: string | null;
  bookNameInput: string;
  canLeaveSharedBook: boolean;
  canEditBookName: boolean;
  currentUserId: string;
  isOwner: boolean;
  onApproveJoinRequest: (requestId: string) => Promise<boolean>;
  onBeforeCopyShareCode: () => Promise<void> | void;
  onChangeBookName: (value: string) => void;
  onChangeShareCodeInput: (value: string) => void;
  onJoin: () => unknown;
  onLeave: () => unknown;
  onRejectJoinRequest: (requestId: string) => Promise<boolean>;
  onSaveBookName: () => Promise<boolean>;
  pendingJoinRequests: LedgerBookJoinRequest[];
  shareCodeInput: string;
};

export function SharedLedgerBookCard({
  activeBook,
  bookName,
  bookNameInput,
  canLeaveSharedBook,
  canEditBookName,
  currentUserId,
  isOwner,
  onApproveJoinRequest,
  onBeforeCopyShareCode,
  onChangeBookName,
  onChangeShareCodeInput,
  onJoin,
  onLeave,
  onRejectJoinRequest,
  onSaveBookName,
  pendingJoinRequests,
  shareCodeInput,
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
          <Text numberOfLines={1} style={[styles.bookName, styles.bookNameHeaderTitle]}>
            {bookName ?? AppMessages.accountBookFallback}
          </Text>
        )}
        {isSharedBook ? (
          <View style={[styles.stateBadge, styles.sharedBadge]}>
            <Text style={[styles.stateBadgeText, styles.sharedBadgeText]}>
              {AppMessages.accountBookSharedState}
            </Text>
          </View>
        ) : null}
      </View>
      {shareCode ? (
        <View style={styles.codeBlock}>
          <Text style={styles.helpText}>{AppMessages.accountShareCodeHint}</Text>
          <View style={styles.shareCodeRow}>
            <ActionButton
              fullWidth
              label={ShareLedgerMessages.copyCodeAction}
              onPress={() => {
                void handleCopyShareCode();
              }}
              variant="primary"
            />
          </View>
        </View>
      ) : null}
      {isOwner && pendingJoinRequests.length ? (
        <View style={[styles.sectionContent, styles.subsection]}>
          <LedgerBookJoinRequests
            onApproveRequest={onApproveJoinRequest}
            onRejectRequest={onRejectJoinRequest}
            requests={pendingJoinRequests}
          />
        </View>
      ) : null}
      <View style={[styles.sectionContent, styles.subsection, styles.sectionBottomInset]}>
        <Text style={styles.sectionTitle}>{AppMessages.accountJoinTitle}</Text>
        <Text style={styles.helpText}>{AppMessages.accountJoinSubtitle}</Text>
        <TextInput
          autoCapitalize="characters"
          maxLength={SHARE_CODE_LENGTH}
          onChangeText={onChangeShareCodeInput}
          placeholder={AppMessages.accountJoinPlaceholder}
          style={styles.input}
          value={shareCodeInput}
        />
        <View style={styles.actionRow}>
          <ActionButton label={AppMessages.accountJoinAction} onPress={onJoin} />
        </View>
        {canLeaveSharedBook ? (
          <View style={styles.leaveSection}>
            <Text style={styles.helpText}>{AppMessages.accountDisconnectHint}</Text>
            <ActionButton
              label={AppMessages.accountDisconnectAction}
              onPress={onLeave}
              variant="destructive"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
