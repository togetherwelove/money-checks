import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { LedgerBookManagementCopy } from "../../constants/ledgerBookManagement";
import {
  SubscriptionConfig,
  type SubscriptionTier,
  SubscriptionTiers,
} from "../../constants/subscription";
import { showNativeToast } from "../../lib/nativeToast";
import type { AccessibleLedgerBook, LedgerBook } from "../../types/ledgerBook";
import { ActionButton } from "../ActionButton";
import { IconActionButton } from "../IconActionButton";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanelStyles";

type LedgerBookManagementCardProps = {
  accessibleBooks: AccessibleLedgerBook[];
  activeBook: LedgerBook | null;
  currentUserId: string;
  onCreateLedgerBook: (nextName: string) => Promise<boolean>;
  onOpenSubscription: () => void;
  onSwitchLedgerBook: (bookId: string) => Promise<boolean>;
  subscriptionTier: SubscriptionTier;
};

export function LedgerBookManagementCard({
  accessibleBooks,
  activeBook,
  currentUserId,
  onCreateLedgerBook,
  onOpenSubscription,
  onSwitchLedgerBook,
  subscriptionTier,
}: LedgerBookManagementCardProps) {
  const [newBookName, setNewBookName] = useState("");
  const ownedBookCount = accessibleBooks.filter((book) => book.ownerId === currentUserId).length;
  const ownedBookLimit =
    subscriptionTier === SubscriptionTiers.plus
      ? SubscriptionConfig.plusOwnedLedgerBookLimit
      : SubscriptionConfig.freeOwnedLedgerBookLimit;
  const canCreateOwnedBook = ownedBookCount < ownedBookLimit;
  const shouldShowUpgradeAction =
    subscriptionTier === SubscriptionTiers.free &&
    ownedBookCount >= SubscriptionConfig.freeOwnedLedgerBookLimit;

  const handleCreateLedgerBook = async () => {
    const normalizedName = newBookName.trim();
    if (!normalizedName) {
      return;
    }

    if (!canCreateOwnedBook) {
      showNativeToast(LedgerBookManagementCopy.createLimitReached);
      return;
    }

    const didCreate = await onCreateLedgerBook(normalizedName);
    showNativeToast(
      didCreate ? LedgerBookManagementCopy.createSuccess : LedgerBookManagementCopy.createError,
    );

    if (didCreate) {
      setNewBookName("");
    }
  };

  const handleSwitchLedgerBook = async (bookId: string) => {
    const didSwitch = await onSwitchLedgerBook(bookId);
    showNativeToast(
      didSwitch ? LedgerBookManagementCopy.switchSuccess : LedgerBookManagementCopy.switchError,
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.sectionTitle}>{LedgerBookManagementCopy.listTitle}</Text>
          <Text style={styles.hintText}>
            {ownedBookCount}/{ownedBookLimit} · {LedgerBookManagementCopy.freeLimitHint}
          </Text>
        </View>
        {shouldShowUpgradeAction ? (
          <ActionButton
            label={LedgerBookManagementCopy.upgradeAction}
            onPress={onOpenSubscription}
            size="inline"
            variant="primary"
          />
        ) : null}
      </View>
      <View style={styles.ledgerBookList}>
        {accessibleBooks.length > 0 ? (
          accessibleBooks.map((book) => {
            const isActiveBook = book.id === activeBook?.id;
            const isOwner = book.ownerId === currentUserId;

            return (
              <View key={book.id} style={styles.ledgerBookItem}>
                <View style={styles.ledgerBookItemContent}>
                  <Text numberOfLines={1} style={styles.ledgerBookItemName}>
                    {book.name}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.stateBadge}>
                      <Text style={styles.stateBadgeText}>
                        {isOwner
                          ? LedgerBookManagementCopy.ownerBadge
                          : LedgerBookManagementCopy.sharedBadge}
                      </Text>
                    </View>
                    {isActiveBook ? (
                      <View style={[styles.stateBadge, styles.activeBadge]}>
                        <Text style={[styles.stateBadgeText, styles.activeBadgeText]}>
                          {LedgerBookManagementCopy.currentBadge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <IconActionButton
                  accessibilityLabel={LedgerBookManagementCopy.switchActionAccessibilityLabel}
                  icon={isActiveBook ? "check" : "repeat"}
                  isActive={isActiveBook}
                  onPress={() => {
                    void handleSwitchLedgerBook(book.id);
                  }}
                />
              </View>
            );
          })
        ) : (
          <Text style={styles.helpText}>{LedgerBookManagementCopy.emptyList}</Text>
        )}
      </View>
      <View style={styles.createBookRow}>
        <TextInput
          autoCapitalize="words"
          autoComplete="off"
          autoCorrect={false}
          editable={canCreateOwnedBook}
          importantForAutofill="no"
          onChangeText={setNewBookName}
          onSubmitEditing={() => {
            void handleCreateLedgerBook();
          }}
          placeholder={LedgerBookManagementCopy.createNamePlaceholder}
          returnKeyType="done"
          spellCheck={false}
          style={styles.createBookInput}
          submitBehavior="blurAndSubmit"
          textContentType="none"
          value={newBookName}
        />
        <ActionButton
          disabled={!canCreateOwnedBook || !newBookName.trim()}
          label={LedgerBookManagementCopy.createAction}
          onPress={handleCreateLedgerBook}
          size="inline"
          variant="secondary"
        />
      </View>
    </View>
  );
}
