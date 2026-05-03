import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";

import { CommonActionCopy } from "../../constants/commonActions";
import { LedgerBookManagementCopy } from "../../constants/ledgerBookManagement";
import {
  SubscriptionConfig,
  type SubscriptionTier,
  SubscriptionTiers,
} from "../../constants/subscription";
import { appPlatform } from "../../lib/appPlatform";
import { showNativeToast } from "../../lib/nativeToast";
import type { AccessibleLedgerBook, LedgerBook } from "../../types/ledgerBook";
import { IconActionButton } from "../IconActionButton";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanelStyles";

type LedgerBookManagementCardProps = {
  accessibleBooks: AccessibleLedgerBook[];
  activeBook: LedgerBook | null;
  currentUserId: string;
  onCreateLedgerBook: (nextName: string) => Promise<boolean>;
  onSwitchLedgerBook: (bookId: string) => Promise<boolean>;
  subscriptionTier: SubscriptionTier;
};

export function LedgerBookManagementCard({
  accessibleBooks,
  activeBook,
  currentUserId,
  onCreateLedgerBook,
  onSwitchLedgerBook,
  subscriptionTier,
}: LedgerBookManagementCardProps) {
  const [newBookName, setNewBookName] = useState("");
  const ownedBookCount = accessibleBooks.filter((book) => book.ownerId === currentUserId).length;
  const accessibleBookCount = accessibleBooks.length;
  const ownedBookLimit =
    subscriptionTier === SubscriptionTiers.plus
      ? SubscriptionConfig.plusOwnedLedgerBookLimit
      : SubscriptionConfig.freeOwnedLedgerBookLimit;
  const accessibleBookLimit =
    subscriptionTier === SubscriptionTiers.plus
      ? SubscriptionConfig.plusAccessibleLedgerBookLimit
      : SubscriptionConfig.freeAccessibleLedgerBookLimit;
  const canCreateOwnedBook =
    ownedBookCount < ownedBookLimit && accessibleBookCount < accessibleBookLimit;
  const shouldUseNativeNamePrompt = appPlatform.isIOS;

  const createLedgerBook = async (normalizedName: string) => {
    const didCreate = await onCreateLedgerBook(normalizedName);
    showNativeToast(
      didCreate ? LedgerBookManagementCopy.createSuccess : LedgerBookManagementCopy.createError,
    );

    if (didCreate) {
      setNewBookName("");
    }
  };

  const resolveCreatableLedgerBookName = (nextName: string) => {
    const normalizedName = nextName.trim();
    if (!normalizedName) {
      showNativeToast(LedgerBookManagementCopy.createNameRequired);
      return null;
    }

    if (!canCreateOwnedBook) {
      showNativeToast(LedgerBookManagementCopy.createLimitReached);
      return null;
    }

    return normalizedName;
  };

  const confirmCreateLedgerBook = (nextName: string) => {
    const normalizedName = resolveCreatableLedgerBookName(nextName);
    if (!normalizedName) {
      return;
    }

    Alert.alert(
      LedgerBookManagementCopy.createConfirmTitle,
      `${normalizedName} ${LedgerBookManagementCopy.createConfirmMessageSuffix}`,
      [
        {
          style: "cancel",
          text: CommonActionCopy.cancel,
        },
        {
          onPress: () => {
            void createLedgerBook(normalizedName);
          },
          text: LedgerBookManagementCopy.createAction,
        },
      ],
    );
  };

  const createLedgerBookFromPrompt = (nextName: string) => {
    const normalizedName = resolveCreatableLedgerBookName(nextName);
    if (!normalizedName) {
      return;
    }

    void createLedgerBook(normalizedName);
  };

  const handlePressCreateLedgerBook = () => {
    if (!canCreateOwnedBook) {
      showNativeToast(LedgerBookManagementCopy.createLimitReached);
      return;
    }

    if (!shouldUseNativeNamePrompt) {
      confirmCreateLedgerBook(newBookName);
      return;
    }

    Alert.prompt(
      LedgerBookManagementCopy.createNamePromptTitle,
      LedgerBookManagementCopy.createNamePromptMessage,
      [
        {
          style: "cancel",
          text: CommonActionCopy.cancel,
        },
        {
          onPress: (nextName?: string) => {
            createLedgerBookFromPrompt(nextName ?? "");
          },
          text: LedgerBookManagementCopy.createAction,
        },
      ],
      "plain-text",
      "",
      "default",
    );
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
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{LedgerBookManagementCopy.listTitle}</Text>
          <Text style={styles.hintText}>
            {accessibleBookCount}/{accessibleBookLimit}
          </Text>
        </View>
        <IconActionButton
          accessibilityLabel={LedgerBookManagementCopy.createAction}
          disabled={!canCreateOwnedBook || (!shouldUseNativeNamePrompt && !newBookName.trim())}
          icon="plus"
          onPress={handlePressCreateLedgerBook}
        />
      </View>
      <View
        style={[
          styles.ledgerBookList,
          shouldUseNativeNamePrompt ? styles.sectionBottomInset : null,
        ]}
      >
        {accessibleBooks.length > 0 ? (
          accessibleBooks.map((book) => {
            const isActiveBook = book.id === activeBook?.id;
            const isOwner = book.ownerId === currentUserId;
            const ownershipLabel = isOwner
              ? LedgerBookManagementCopy.ownerBadge
              : LedgerBookManagementCopy.sharedBadge;
            const bookStateLabel = isActiveBook
              ? `${ownershipLabel} · ${LedgerBookManagementCopy.activeStateLabel}`
              : ownershipLabel;

            return (
              <View key={book.id} style={styles.ledgerBookItem}>
                <View style={styles.ledgerBookItemContent}>
                  <Text numberOfLines={1} style={styles.ledgerBookItemName}>
                    {book.name}
                  </Text>
                  <Text style={styles.ledgerBookItemMeta}>{bookStateLabel}</Text>
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
      {!shouldUseNativeNamePrompt ? (
        <View style={[styles.createBookRow, styles.sectionBottomInset]}>
          <TextInput
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect={false}
            editable={canCreateOwnedBook}
            importantForAutofill="no"
            onChangeText={setNewBookName}
            onSubmitEditing={() => {
              handlePressCreateLedgerBook();
            }}
            placeholder={LedgerBookManagementCopy.createNamePlaceholder}
            returnKeyType="done"
            spellCheck={false}
            style={styles.createBookInput}
            submitBehavior="blurAndSubmit"
            textContentType="none"
            value={newBookName}
          />
        </View>
      ) : null}
    </View>
  );
}
