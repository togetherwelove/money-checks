import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { AppLayout } from "../constants/layout";
import { LedgerBookManagementCopy } from "../constants/ledgerBookManagement";
import type { AccessibleLedgerBook } from "../types/ledgerBook";
import { IconActionButton } from "./IconActionButton";

type LedgerBookSwitcherModalProps = {
  activeBookId: string | null;
  books: AccessibleLedgerBook[];
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (bookId: string) => void;
};

export function LedgerBookSwitcherModal({
  activeBookId,
  books,
  isOpen,
  onClose,
  onSelectBook,
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
                  style={[styles.bookItem, isActiveBook ? styles.activeBookItem : null]}
                >
                  <View style={styles.bookTextBlock}>
                    <Text numberOfLines={1} style={styles.bookName}>
                      {book.name}
                    </Text>
                    <Text style={styles.bookMeta}>
                      {isActiveBook ? LedgerBookManagementCopy.currentBadge : ownershipLabel}
                    </Text>
                  </View>
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
  bookTextBlock: {
    flex: 1,
    gap: 5,
  },
  bookName: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  bookMeta: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "600",
  },
});
