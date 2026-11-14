import { useAppTheme } from "../../hooks/useAppTheme";
import { Feather } from "../AppIcons";
import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { getAppColors } from "../../constants/colors";
import { AppMessages } from "../../constants/messages";
import { ShareLedgerMessages } from "../../constants/shareLedgerMessages";
import { SharedLedgerPanelUi } from "../../constants/sharedLedgerPanel";
import { copyLedgerShareCode } from "../../lib/copyLedgerShareCode";
import type { LedgerBook } from "../../types/ledgerBook";
import type {
  LedgerBookJoinApprovalAttempt,
  LedgerBookJoinRequest,
} from "../../types/ledgerBookJoinRequest";
import { ActionButton } from "../ActionButton";
import { IconActionButton } from "../IconActionButton";
import { LedgerBookJoinRequests } from "../LedgerBookJoinRequests";
import { getSharedLedgerPanelStyles } from "./sharedLedgerPanelStyles";

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
  useAppTheme();
  const [isEditingBookName, setIsEditingBookName] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const copyInProgress = useRef(false);
  const mounted = useRef(true);
  const currentBook = useRef(activeBook);
  currentBook.current = activeBook;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const shareCode = activeBook?.shareCode ?? null;
  const shouldShowJoinRequests = isOwner && Boolean(pendingJoinRequests.length);
  const hasDetails = Boolean(shareCode || shouldShowJoinRequests);

  const handleCopyShareCode = async () => {
    if (!shareCode || isReadOnlyDueToPlanLimit || copyInProgress.current) {
      return;
    }

    copyInProgress.current = true;
    setIsCopying(true);
    const bookId = activeBook?.id;
    try {
      await copyLedgerShareCode(
        shareCode,
        onBeforeCopyShareCode,
        () =>
          mounted.current &&
          currentBook.current?.id === bookId &&
          currentBook.current?.shareCode === shareCode,
      );
    } finally {
      copyInProgress.current = false;
      if (mounted.current) setIsCopying(false);
    }
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
    <View
      style={[getSharedLedgerPanelStyles().section, getSharedLedgerPanelStyles().primarySection]}
    >
      <View
        style={[
          getSharedLedgerPanelStyles().sectionHeader,
          hasDetails ? null : getSharedLedgerPanelStyles().sectionBottomInset,
        ]}
      >
        {canEditBookName ? (
          isEditingBookName ? (
            <View style={getSharedLedgerPanelStyles().bookNameEditRow}>
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
                style={getSharedLedgerPanelStyles().bookNameHeaderInput}
                submitBehavior="blurAndSubmit"
                textContentType="none"
                value={bookNameInput}
              />
              <View style={getSharedLedgerPanelStyles().bookNameActionSlot}>
                <Text
                  onPress={handleCancelEditingBookName}
                  style={getSharedLedgerPanelStyles().bookNameCancelAction}
                >
                  취소
                </Text>
              </View>
            </View>
          ) : (
            <View style={getSharedLedgerPanelStyles().bookNameRow}>
              <Text numberOfLines={1} style={getSharedLedgerPanelStyles().bookName}>
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
          <Text
            numberOfLines={1}
            style={[
              getSharedLedgerPanelStyles().bookName,
              getSharedLedgerPanelStyles().bookNameHeaderTitle,
            ]}
          >
            {bookName ?? AppMessages.accountBookFallback}
          </Text>
        )}
      </View>
      {shareCode ? (
        <View
          style={[
            getSharedLedgerPanelStyles().codeBlock,
            shouldShowJoinRequests ? null : getSharedLedgerPanelStyles().sectionBottomInset,
          ]}
        >
          <Text style={getSharedLedgerPanelStyles().helpText}>
            {AppMessages.accountShareCodeHint}
          </Text>
          <View style={getSharedLedgerPanelStyles().shareCodeRow}>
            <ActionButton
              fullWidth
              label={ShareLedgerMessages.copyCodeAction}
              labelContent={
                <View style={getSharedLedgerPanelStyles().copyActionContent}>
                  <Feather
                    color={getAppColors().onPrimary}
                    name="copy"
                    size={SharedLedgerPanelUi.copyActionIconSize}
                  />
                  <Text style={getSharedLedgerPanelStyles().copyActionText}>
                    {ShareLedgerMessages.copyCodeAction}
                  </Text>
                </View>
              }
              onPress={() => {
                void handleCopyShareCode();
              }}
              disabled={isReadOnlyDueToPlanLimit || isCopying}
              loading={isCopying}
              variant="primary"
            />
          </View>
        </View>
      ) : null}
      {shouldShowJoinRequests ? (
        <View
          style={[
            getSharedLedgerPanelStyles().sectionContent,
            getSharedLedgerPanelStyles().subsection,
            getSharedLedgerPanelStyles().sectionBottomInset,
          ]}
        >
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
