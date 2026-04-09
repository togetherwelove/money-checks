import { Text, View } from "react-native";

import { EMPTY_VALUE_PLACEHOLDER } from "../../constants/ledgerDisplay";
import { AppMessages } from "../../constants/messages";
import type { LedgerBook } from "../../types/ledgerBook";
import type { LedgerBookJoinRequest } from "../../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../../types/ledgerBookMember";
import { LedgerBookJoinRequests } from "../LedgerBookJoinRequests";
import { LedgerBookMembers } from "../LedgerBookMembers";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanelStyles";

type SharedLedgerBookCardProps = {
  activeBook: LedgerBook | null;
  onApproveJoinRequest: (requestId: string) => Promise<boolean>;
  currentUserId: string;
  members: LedgerBookMember[];
  onKickMember: (targetUserId: string) => Promise<boolean>;
  onRejectJoinRequest: (requestId: string) => Promise<boolean>;
  pendingJoinRequests: LedgerBookJoinRequest[];
};

export function SharedLedgerBookCard({
  activeBook,
  onApproveJoinRequest,
  currentUserId,
  members,
  onKickMember,
  onRejectJoinRequest,
  pendingJoinRequests,
}: SharedLedgerBookCardProps) {
  const isSharedBook = Boolean(activeBook && activeBook.ownerId !== currentUserId);
  const isOwner = Boolean(activeBook && activeBook.ownerId === currentUserId);

  return (
    <View style={[styles.section, styles.primarySection]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{AppMessages.accountBookTitle}</Text>
        <View style={[styles.stateBadge, isSharedBook ? styles.sharedBadge : styles.personalBadge]}>
          <Text
            style={[
              styles.stateBadgeText,
              isSharedBook ? styles.sharedBadgeText : styles.personalBadgeText,
            ]}
          >
            {isSharedBook
              ? AppMessages.accountBookSharedState
              : AppMessages.accountBookPersonalState}
          </Text>
        </View>
      </View>
      <Text style={styles.bookName}>{activeBook?.name ?? AppMessages.accountBookFallback}</Text>
      <View style={styles.codeBlock}>
        <Text style={styles.sectionLabel}>{AppMessages.accountShareCode}</Text>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          numberOfLines={1}
          style={styles.shareCode}
        >
          {activeBook?.shareCode ?? EMPTY_VALUE_PLACEHOLDER}
        </Text>
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
