import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Share, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { LedgerBookNicknameCopy } from "../../constants/ledgerBookNickname";
import { AppMessages } from "../../constants/messages";
import { ShareLedgerMessages } from "../../constants/shareLedgerMessages";
import { SharedLedgerPanelUi } from "../../constants/sharedLedgerPanel";
import { showNativeToast } from "../../lib/nativeToast";
import { formatSharedLedgerInviteMessage } from "../../lib/sharedLedgerInvite";
import type { LedgerBook } from "../../types/ledgerBook";
import type {
  LedgerBookJoinApprovalAttempt,
  LedgerBookJoinRequest,
} from "../../types/ledgerBookJoinRequest";
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
  onApproveJoinRequest: (requestId: string) => Promise<LedgerBookJoinApprovalAttempt>;
  onBeforeCopyShareCode: () => Promise<void> | void;
  onChangeBookName: (value: string) => void;
  onLeave: () => unknown;
  onRejectJoinRequest: (requestId: string) => Promise<boolean>;
  onSaveBookName: () => Promise<boolean>;
  pendingJoinRequests: LedgerBookJoinRequest[];
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
  onLeave,
  onRejectJoinRequest,
  onSaveBookName,
  pendingJoinRequests,
}: SharedLedgerBookCardProps) {
  const [isEditingBookName, setIsEditingBookName] = useState(false);
  const isSharedBook = Boolean(activeBook && activeBook.ownerId !== currentUserId);
  const shareCode = activeBook?.shareCode ?? null;
  const shouldShowJoinRequests = isOwner && Boolean(pendingJoinRequests.length);
  const hasDetails = Boolean(shareCode || shouldShowJoinRequests || canLeaveSharedBook);

  const handleCopyShareCode = async () => {
    if (!shareCode) {
      return;
    }

    await onBeforeCopyShareCode();

    await Clipboard.setStringAsync(shareCode);
    try {
      await Share.share({
        message: formatSharedLedgerInviteMessage(shareCode),
      });
    } catch (error) {
      console.error("[SharedLedgerBookCard] Share sheet failed", error);
    }
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
      <View style={[styles.sectionHeader, hasDetails ? null : styles.sectionBottomInset]}>
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
        <View
          style={[
            styles.codeBlock,
            shouldShowJoinRequests || canLeaveSharedBook ? null : styles.sectionBottomInset,
          ]}
        >
          <Text style={styles.helpText}>{AppMessages.accountShareCodeHint}</Text>
          <View style={styles.shareCodeRow}>
            <ActionButton
              fullWidth
              label={ShareLedgerMessages.copyCodeAction}
              labelContent={
                <View style={styles.copyActionContent}>
                  <Feather
                    color={AppColors.inverseText}
                    name="copy"
                    size={SharedLedgerPanelUi.copyActionIconSize}
                  />
                  <Text style={styles.copyActionText}>{ShareLedgerMessages.copyCodeAction}</Text>
                </View>
              }
              onPress={() => {
                void handleCopyShareCode();
              }}
              variant="primary"
            />
          </View>
        </View>
      ) : null}
      {shouldShowJoinRequests ? (
        <View
          style={[
            styles.sectionContent,
            styles.subsection,
            canLeaveSharedBook ? null : styles.sectionBottomInset,
          ]}
        >
          <LedgerBookJoinRequests
            onApproveRequest={onApproveJoinRequest}
            onRejectRequest={onRejectJoinRequest}
            requests={pendingJoinRequests}
          />
        </View>
      ) : null}
      {canLeaveSharedBook ? (
        <View style={[styles.sectionContent, styles.subsection, styles.sectionBottomInset]}>
          <View style={styles.leaveSection}>
            <Text style={styles.helpText}>{AppMessages.accountDisconnectHint}</Text>
            <ActionButton
              label={AppMessages.accountDisconnectAction}
              onPress={onLeave}
              variant="destructive"
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
