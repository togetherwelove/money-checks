import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { ScreenHeaderBlock } from "../components/ScreenHeaderBlock";
import { SharedLedgerPanel } from "../components/SharedLedgerPanel";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { DEFAULT_MEMBER_DISPLAY_NAME } from "../constants/ledgerDisplay";
import { AppMessages } from "../constants/messages";
import { fetchLedgerBookMembers } from "../lib/ledgerBooks";
import { fetchProfileDisplayName } from "../lib/profiles";
import { supabase } from "../lib/supabase";
import type { LedgerBook } from "../types/ledgerBook";
import type {
  JoinSharedLedgerBookAttempt,
  LedgerBookJoinRequest,
} from "../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import type { LedgerBookMemberRow } from "../types/supabase";

type ShareLedgerScreenProps = {
  activeBook: LedgerBook | null;
  onApproveJoinRequest: (requestId: string) => Promise<boolean>;
  onJoinSharedLedgerBook: (shareCode: string) => Promise<JoinSharedLedgerBookAttempt>;
  onLeaveSharedLedgerBook: () => Promise<boolean>;
  onRemoveSharedLedgerMember: (targetUserId: string) => Promise<boolean>;
  onRejectJoinRequest: (requestId: string) => Promise<boolean>;
  pendingJoinRequests: LedgerBookJoinRequest[];
  userId: string;
};

export function ShareLedgerScreen({
  activeBook,
  onApproveJoinRequest,
  onLeaveSharedLedgerBook,
  onJoinSharedLedgerBook,
  onRemoveSharedLedgerMember,
  onRejectJoinRequest,
  pendingJoinRequests,
  userId,
}: ShareLedgerScreenProps) {
  const [members, setMembers] = useState<LedgerBookMember[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      if (!activeBook) {
        setMembers([]);
        return;
      }

      try {
        const nextMembers = await fetchLedgerBookMembers(activeBook.id);
        if (isMounted) {
          setMembers(nextMembers);
        }
      } catch {
        if (isMounted) {
          setMembers([]);
        }
      }
    };

    void loadMembers();

    if (!activeBook) {
      return () => {
        isMounted = false;
      };
    }

    const channel = supabase
      .channel(`share-members-${activeBook.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_book_members",
          filter: `book_id=eq.${activeBook.id}`,
        },
        (payload) => {
          void handleMemberChange(
            payload as RealtimePostgresChangesPayload<Record<string, unknown>>,
          );
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [activeBook]);

  const handleKickMember = async (targetUserId: string) => {
    const didKick = await onRemoveSharedLedgerMember(targetUserId);
    if (didKick) {
      setMembers((currentMembers) =>
        currentMembers.filter((member) => member.userId !== targetUserId),
      );
    }
    return didKick;
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <ScreenHeaderBlock eyebrow={AppMessages.menuTitle} title={AppMessages.shareTitle} />
      <SharedLedgerPanel
        activeBook={activeBook}
        currentUserId={userId}
        members={members}
        onApproveJoinRequest={onApproveJoinRequest}
        onKickMember={handleKickMember}
        onLeaveSharedLedgerBook={onLeaveSharedLedgerBook}
        onJoinSharedLedgerBook={onJoinSharedLedgerBook}
        onRejectJoinRequest={onRejectJoinRequest}
        pendingJoinRequests={pendingJoinRequests}
      />
    </ScrollView>
  );

  async function handleMemberChange(
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  ) {
    if (payload.eventType === "DELETE") {
      const deletedUserId = typeof payload.old.user_id === "string" ? payload.old.user_id : null;
      if (!deletedUserId) {
        return;
      }

      setMembers((currentMembers) =>
        currentMembers.filter((member) => member.userId !== deletedUserId),
      );
      return;
    }

    const changedMember = payload.new as LedgerBookMemberRow;
    let displayName = DEFAULT_MEMBER_DISPLAY_NAME;
    try {
      displayName =
        (await fetchProfileDisplayName(changedMember.user_id)).trim() ||
        DEFAULT_MEMBER_DISPLAY_NAME;
    } catch {
      displayName = DEFAULT_MEMBER_DISPLAY_NAME;
    }

    setMembers((currentMembers) => {
      const nextMember: LedgerBookMember = {
        displayName,
        role: changedMember.role,
        userId: changedMember.user_id,
      };
      const hasExistingMember = currentMembers.some(
        (member) => member.userId === changedMember.user_id,
      );
      const nextMembers = hasExistingMember
        ? currentMembers.map((member) =>
            member.userId === changedMember.user_id ? nextMember : member,
          )
        : [...currentMembers, nextMember];

      return sortLedgerBookMembers(nextMembers);
    });
  }
}

function sortLedgerBookMembers(members: LedgerBookMember[]): LedgerBookMember[] {
  return [...members].sort((left, right) => left.displayName.localeCompare(right.displayName));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
    paddingBottom: 24,
  },
});
