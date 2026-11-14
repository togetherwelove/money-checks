import { useAppTheme } from "../../hooks/useAppTheme";
import { Text, TextInput, View } from "react-native";

import { AppMessages } from "../../constants/messages";
import { ActionButton } from "../ActionButton";
import { getSharedLedgerPanelStyles } from "./sharedLedgerPanelStyles";

type SharedLedgerJoinCardProps = {
  disabled?: boolean;
  onChangeShareCodeInput: (value: string) => void;
  onJoin: () => unknown;
  shareCodeInput: string;
};

export function SharedLedgerJoinCard({
  disabled = false,
  onChangeShareCodeInput,
  onJoin,
  shareCodeInput,
}: SharedLedgerJoinCardProps) {
  useAppTheme();
  return (
    <View
      style={[
        getSharedLedgerPanelStyles().section,
        getSharedLedgerPanelStyles().sectionContentInset,
      ]}
    >
      <Text style={getSharedLedgerPanelStyles().sectionTitle}>{AppMessages.accountJoinTitle}</Text>
      <Text style={getSharedLedgerPanelStyles().helpText}>{AppMessages.accountJoinSubtitle}</Text>
      <TextInput
        autoCapitalize="characters"
        editable={!disabled}
        onChangeText={onChangeShareCodeInput}
        onSubmitEditing={onJoin}
        placeholder={AppMessages.accountJoinPlaceholder}
        returnKeyType="done"
        style={[
          getSharedLedgerPanelStyles().input,
          disabled ? getSharedLedgerPanelStyles().disabledInput : null,
        ]}
        submitBehavior="blurAndSubmit"
        value={shareCodeInput}
      />
      <View style={getSharedLedgerPanelStyles().actionRow}>
        <ActionButton disabled={disabled} label={AppMessages.accountJoinAction} onPress={onJoin} />
      </View>
    </View>
  );
}
