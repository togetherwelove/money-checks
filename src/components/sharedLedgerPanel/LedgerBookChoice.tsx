import { formatLedgerBookTitle } from "../../lib/ledgerShareCode";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { LedgerBookManagementCopy as Copy } from "../../constants/ledgerBookManagement";
import { NotificationBadgeCopy } from "../../constants/notificationBadges";
import { useAppTheme } from "../../hooks/useAppTheme";
import type { AccessibleLedgerBook } from "../../types/ledgerBook";
import { getSharedLedgerPanelStyles } from "./sharedLedgerPanelStyles";

type Props = {
  book: AccessibleLedgerBook;
  current?: boolean;
  currentUserId: string;
  nameControl?: ReactNode;
  readOnly: boolean;
  unread: boolean;
  onSelect: (bookId: string) => void;
};

export function LedgerBookChoice({
  book,
  current = false,
  currentUserId,
  nameControl,
  readOnly,
  unread,
  onSelect,
}: Props) {
  useAppTheme();
  const styles = getSharedLedgerPanelStyles();
  const content = (
    <>
      {unread ? (
        <View
          accessible
          accessibilityLabel={NotificationBadgeCopy.unreadBookAccessibilityLabel}
          style={styles.pendingRequestBadge}
        />
      ) : null}
      <View style={styles.ledgerBookItemContent}>
        {nameControl ?? (
          <Text numberOfLines={1} style={styles.ledgerBookItemName}>
            {formatLedgerBookTitle(book.name, book.shareCode)}
          </Text>
        )}
      </View>
      {readOnly ? <Text style={styles.ledgerBookItemMeta}>{Copy.readOnlyBadge}</Text> : null}
      <Text style={styles.ledgerBookItemMeta}>
        {book.ownerId === currentUserId ? Copy.ownerBadge : Copy.sharedBadge}
      </Text>
    </>
  );
  return current ? (
    <View style={styles.currentBookCapsule}>{content}</View>
  ) : (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${Copy.switchActionAccessibilityLabel}: ${formatLedgerBookTitle(book.name, book.shareCode)}`}
      onPress={() => onSelect(book.id)}
      style={styles.otherBookRow}
    >
      {content}
    </Pressable>
  );
}
