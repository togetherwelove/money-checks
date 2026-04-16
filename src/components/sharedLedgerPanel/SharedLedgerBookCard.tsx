import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { LedgerBookNicknameCopy } from "../../constants/ledgerBookNickname";
import { EMPTY_VALUE_PLACEHOLDER } from "../../constants/ledgerDisplay";
import { AppMessages } from "../../constants/messages";
import { showNativeToast } from "../../lib/nativeToast";
import type { LedgerBook } from "../../types/ledgerBook";
import type { LedgerBookJoinRequest } from "../../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../../types/ledgerBookMember";
import { ActionButton } from "../ActionButton";
import { IconActionButton } from "../IconActionButton";
import { LedgerBookJoinRequests } from "../LedgerBookJoinRequests";
import { LedgerBookMembers } from "../LedgerBookMembers";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanelStyles";

const SHARE_CODE_COPY_ACCESSIBILITY_LABEL = "공유 코드 복사";
const SHARE_CODE_COPY_SUCCESS_TOAST = "공유 코드를 복사했어요.";

type SharedLedgerBookCardProps = {
  activeBook: LedgerBook | null;
  bookName: string | null;
  bookNameInput: string;
  canEditBookName: boolean;
  currentUserId: string;
  isOwner: boolean;
  members: LedgerBookMember[];
  onApproveJoinRequest: (requestId: string) => Promise<boolean>;
  onChangeBookName: (value: string) => void;
  onKickMember: (targetUserId: string) => Promise<boolean>;
  onRejectJoinRequest: (requestId: string) => Promise<boolean>;
  onSaveBookName: () => Promise<boolean>;
  pendingJoinRequests: LedgerBookJoinRequest[];
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
      showNativeToast(SHARE_CODE_COPY_SUCCESS_TOAST);
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
                  autoComplete="off"
                  autoCapitalize="words"
                  autoCorrect={false}
                  importantForAutofill="no"
                  textContentType="none"
                  onChangeText={onChangeBookName}
                  placeholder={LedgerBookNicknameCopy.inputPlaceholder}
                  spellCheck={false}
                  style={styles.bookNameHeaderInput}
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
              accessibilityLabel={SHARE_CODE_COPY_ACCESSIBILITY_LABEL}
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
