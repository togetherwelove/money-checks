import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Share, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
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
  canEditBookName: boolean;
  currentUserId: string;
  isOwner: boolean;
  isReadOnlyDueToPlanLimit: boolean;
  onApproveJoinRequest: (requestId: string) => Promise<LedgerBookJoinApprovalAttempt>;
  onBeforeCopyShareCode: () => Promise<void> | void;
  onChangeBookName: (value: string) => void;
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
  isReadOnlyDueToPlanLimit,
  onApproveJoinRequest,
  onBeforeCopyShareCode,
  onChangeBookName,
  onRejectJoinRequest,
  onSaveBookName,
  pendingJoinRequests,
}: SharedLedgerBookCardProps) {
  const [isEditingBookName, setIsEditingBookName] = useState(false);
  const shareCode = activeBook?.shareCode ?? null;
  const shouldShowJoinRequests = isOwner && Boolean(pendingJoinRequests.length);
  const hasDetails = Boolean(shareCode || shouldShowJoinRequests);

  const handleCopyShareCode = async () => {
    if (!shareCode) {
      return;
    }

    await onBeforeCopyShareCode();

    await Clipboard.setStringAsync(shareCode);
    try {
      await Share.share({
        message: formatSharedLedgerInviteMessage(
          bookName ?? "나의 가계부",
          shareCode,
        ),
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
    onChangeBookName(bookName ?? "나의 가계부");
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
                placeholder="가계부 이름 입력"
                returnKeyType="done"
                spellCheck={false}
                style={styles.bookNameHeaderInput}
                submitBehavior="blurAndSubmit"
                textContentType="none"
                value={bookNameInput}
              />
              <View style={styles.bookNameActionSlot}>
                <Text onPress={handleCancelEditingBookName} style={styles.bookNameCancelAction}>
                  취소
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.bookNameRow}>
              <Text numberOfLines={1} style={styles.bookName}>
                {bookName ?? "나의 가계부"}
              </Text>
              <IconActionButton
                accessibilityLabel="가계부 이름 수정"
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
      </View>
      {shareCode ? (
        <View style={[styles.codeBlock, shouldShowJoinRequests ? null : styles.sectionBottomInset]}>
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
              disabled={isReadOnlyDueToPlanLimit}
              variant="primary"
            />
          </View>
        </View>
      ) : null}
      {shouldShowJoinRequests ? (
        <View style={[styles.sectionContent, styles.subsection, styles.sectionBottomInset]}>
          <LedgerBookJoinRequests
            disabled={isReadOnlyDueToPlanLimit}
            onApproveRequest={onApproveJoinRequest}
            onRejectRequest={onRejectJoinRequest}
            requests={pendingJoinRequests}
          />
        </View>
      ) : null}
    </View>
  );
}
