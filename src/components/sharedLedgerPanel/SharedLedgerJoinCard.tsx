import { Text, TextInput, View } from "react-native";

import { SHARE_CODE_LENGTH } from "../../constants/ledgerDisplay";
import { AppMessages } from "../../constants/messages";
import { ActionButton } from "../ActionButton";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanelStyles";

type SharedLedgerJoinCardProps = {
  onChangeShareCodeInput: (value: string) => void;
  onJoin: () => unknown;
  shareCodeInput: string;
};

export function SharedLedgerJoinCard({
  onChangeShareCodeInput,
  onJoin,
  shareCodeInput,
}: SharedLedgerJoinCardProps) {
  return (
    <View style={[styles.section, styles.sectionContentInset]}>
      <Text style={styles.sectionTitle}>{AppMessages.accountJoinTitle}</Text>
      <Text style={styles.helpText}>{AppMessages.accountJoinSubtitle}</Text>
      <TextInput
        autoCapitalize="characters"
        maxLength={SHARE_CODE_LENGTH}
        onChangeText={onChangeShareCodeInput}
        onSubmitEditing={onJoin}
        placeholder={AppMessages.accountJoinPlaceholder}
        returnKeyType="done"
        style={styles.input}
        submitBehavior="blurAndSubmit"
        value={shareCodeInput}
      />
      <View style={styles.actionRow}>
        <ActionButton label={AppMessages.accountJoinAction} onPress={onJoin} />
      </View>
    </View>
  );
}
