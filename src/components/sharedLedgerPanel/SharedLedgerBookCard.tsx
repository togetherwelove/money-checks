import { AppTextBreakProps } from "../../constants/textLayout";
import { getSettingsGroupStyles, SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import { useAppTheme } from "../../hooks/useAppTheme";
import { Feather } from "../AppIcons";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

import { getAppColors } from "../../constants/colors";
import { AppMessages } from "../../constants/messages";
import { ShareLedgerMessages } from "../../constants/shareLedgerMessages";
import { copyLedgerShareCode } from "../../lib/copyLedgerShareCode";
import type { LedgerBook } from "../../types/ledgerBook";
import type {
  LedgerBookJoinApprovalAttempt,
  LedgerBookJoinRequest,
} from "../../types/ledgerBookJoinRequest";
import { ActionButton } from "../ActionButton";
import { LedgerBookJoinRequests } from "../LedgerBookJoinRequests";
import { getSharedLedgerPanelStyles } from "./sharedLedgerPanelStyles";

type SharedLedgerBookCardProps = {
  showJoinRequests?: boolean;
  activeBook: LedgerBook | null;
  currentUserId: string;
  isOwner: boolean;
  isReadOnlyDueToPlanLimit: boolean;
  onApproveJoinRequest: (requestId: string) => Promise<LedgerBookJoinApprovalAttempt>;
  onBeforeCopyShareCode: () => Promise<void> | void;
  onRejectJoinRequest: (requestId: string) => Promise<boolean>;
  pendingJoinRequests: LedgerBookJoinRequest[];
};

export function SharedLedgerBookCard({
  showJoinRequests = true,
  activeBook,
  currentUserId,
  isOwner,
  isReadOnlyDueToPlanLimit,
  onApproveJoinRequest,
  onBeforeCopyShareCode,
  onRejectJoinRequest,
  pendingJoinRequests,
}: SharedLedgerBookCardProps) {
  useAppTheme();
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
  const shouldShowJoinRequests = showJoinRequests && isOwner && Boolean(pendingJoinRequests.length);

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

  return (
    <View style={getSettingsGroupStyles().sections}>
      {shareCode ? (
        <View style={getSettingsGroupStyles().section}>
          <ActionButton
            shape="capsule"
            label={ShareLedgerMessages.copyCodeAction}
            labelContent={
              <View style={getSharedLedgerPanelStyles().capsuleActionContent}>
                <Feather
                  color={getAppColors().text}
                  name="copy"
                  size={SettingsGroupDesign.iconSize}
                />
                <Text style={getSharedLedgerPanelStyles().capsuleActionText}>
                  {ShareLedgerMessages.copyCodeAction}
                </Text>
              </View>
            }
            onPress={() => {
              void handleCopyShareCode();
            }}
            disabled={isReadOnlyDueToPlanLimit || isCopying}
            loading={isCopying}
            variant="secondary"
          />
          <Text {...AppTextBreakProps} style={getSettingsGroupStyles().caption}>
            {AppMessages.accountShareCodeHint}
          </Text>
        </View>
      ) : null}
      {shouldShowJoinRequests ? (
        <View style={[getSettingsGroupStyles().card, getSettingsGroupStyles().body]}>
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
