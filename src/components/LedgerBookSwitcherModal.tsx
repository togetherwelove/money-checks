import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { AppLayout } from "../constants/layout";
import { LedgerBookManagementCopy } from "../constants/ledgerBookManagement";
import { LedgerEditabilityCopy } from "../constants/ledgerEditability";
import type { SubscriptionTier } from "../constants/subscription";
import { isLedgerBookEditableWithinPlanLimit } from "../lib/ledgerEditability";
import type { AccessibleLedgerBook } from "../types/ledgerBook";
import { IconActionButton } from "./IconActionButton";

type LedgerBookSwitcherModalProps = {
  activeBookId: string | null;
  books: AccessibleLedgerBook[];
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (bookId: string) => void;
  subscriptionTier: SubscriptionTier;
};

export function LedgerBookSwitcherModal({
  activeBookId,
  books,
  isOpen,
  onClose,
  onSelectBook,
  subscriptionTier,
}: LedgerBookSwitcherModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <View style={styles.root}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{LedgerBookManagementCopy.listTitle}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>{CommonActionCopy.cancel}</Text>
            </Pressable>
          </View>
          <View style={styles.list}>
            {books.map((book) => {
              const isActiveBook = book.id === activeBookId;
              const isReadOnlyBook = !isLedgerBookEditableWithinPlanLimit(
                subscriptionTier,
                books,
                book.id,
              );
              const ownershipLabel =
                book.role === "owner"
                  ? LedgerBookManagementCopy.ownerBadge
                  : LedgerBookManagementCopy.sharedBadge;

              return (
                <Pressable
                  key={book.id}
                  onPress={() => {
                    if (!isActiveBook) {
                      onSelectBook(book.id);
                    }
                    onClose();
                  }}
                  style={[
                    styles.bookItem,
                    isReadOnlyBook ? styles.readOnlyBookItem : null,
                    isActiveBook ? styles.activeBookItem : null,
                  ]}
                >
                  <View style={styles.bookTextBlock}>
                    <Text
                      numberOfLines={1}
                      style={[styles.bookName, isReadOnlyBook ? styles.readOnlyBookName : null]}
                    >
                      {book.name}
                    </Text>
                    <Text
                      style={[styles.bookMeta, isReadOnlyBook ? styles.readOnlyBookMeta : null]}
                    >
                      {isActiveBook ? LedgerBookManagementCopy.currentBadge : ownershipLabel}
                    </Text>
                  </View>
                  {isReadOnlyBook ? (
                    <View style={styles.readOnlyChip}>
                      <Text style={styles.readOnlyChipText}>
                        {LedgerEditabilityCopy.readOnlyBadge}
                      </Text>
                    </View>
                  ) : null}
                  {isActiveBook ? (
                    <IconActionButton
                      accessibilityLabel={LedgerBookManagementCopy.activeStateLabel}
                      icon="check"
                      isActive
                      onPress={onClose}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: AppLayout.cardContentPadding,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.overlay,
  },
  sheet: {
    gap: AppLayout.cardGap,
    borderRadius: AppLayout.cardRadius,
    backgroundColor: AppColors.surface,
    padding: AppLayout.cardContentPadding,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: AppLayout.compactGap,
  },
  title: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  closeText: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  list: {
    gap: 6,
  },
  bookItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    backgroundColor: AppColors.background,
  },
  activeBookItem: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceMuted,
  },
  readOnlyBookItem: {
    borderColor: AppColors.border,
    backgroundColor: AppColors.surfaceMuted,
    opacity: 0.76,
  },
  bookTextBlock: {
    flex: 1,
    gap: 5,
  },
  bookName: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  readOnlyBookName: {
    color: AppColors.mutedStrongText,
  },
  bookMeta: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "600",
  },
  readOnlyBookMeta: {
    color: AppColors.mutedStrongText,
  },
  readOnlyChip: {
    borderRadius: 999,
    backgroundColor: AppColors.surfaceStrong,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  readOnlyChipText: {
    color: AppColors.expense,
    fontSize: 10,
    fontWeight: "800",
  },
});
