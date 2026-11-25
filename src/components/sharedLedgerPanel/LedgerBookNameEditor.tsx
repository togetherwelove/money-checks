import { formatLedgerBookTitle } from "../../lib/ledgerShareCode";
import { LedgerBookManagementCopy } from "../../constants/ledgerBookManagement";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { AppMessages } from "../../constants/messages";
import { useAppTheme } from "../../hooks/useAppTheme";
import { IconActionButton } from "../IconActionButton";
import { getSharedLedgerPanelStyles } from "./sharedLedgerPanelStyles";

type LedgerBookNameEditorProps = {
  bookName: string | null;
  shareCode?: string | null;
  bookNameInput: string;
  canEditBookName: boolean;
  onChangeBookName: (value: string) => void;
  onSaveBookName: () => Promise<boolean>;
};

export function LedgerBookNameEditor({
  bookName,
  shareCode,
  bookNameInput,
  canEditBookName,
  onChangeBookName,
  onSaveBookName,
}: LedgerBookNameEditorProps) {
  useAppTheme();
  const [isEditingBookName, setIsEditingBookName] = useState(false);
  const handleStartEditingBookName = () => {
    setIsEditingBookName(true);
  };

  const handleCancelEditingBookName = () => {
    onChangeBookName(bookName ?? AppMessages.accountBookFallback);
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
    <View style={getSharedLedgerPanelStyles().bookNameRow}>
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
              placeholder={LedgerBookManagementCopy.renamePlaceholder}
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
                {LedgerBookManagementCopy.cancelAction}
              </Text>
            </View>
          </View>
        ) : (
          <View style={getSharedLedgerPanelStyles().bookNameRow}>
            <Text numberOfLines={1} style={getSharedLedgerPanelStyles().bookName}>
              {formatLedgerBookTitle(bookName ?? AppMessages.accountBookFallback, shareCode)}
            </Text>
            <IconActionButton
              accessibilityLabel={LedgerBookManagementCopy.renameAction}
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
          {formatLedgerBookTitle(bookName ?? AppMessages.accountBookFallback, shareCode)}
        </Text>
      )}
    </View>
  );
}
